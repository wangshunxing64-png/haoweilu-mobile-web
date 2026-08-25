import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { ReviewGenerator } from "../../ai/review-generator.ts";
import { assertAllowedUserMessage } from "../../common/content/content-guard.ts";
import type { IdempotencyService } from "../../common/idempotency/idempotency.service.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { ReviewService } from "./review.service.ts";

const generateSchema = z.object({
  provider: z.enum(["local-template", "deepseek", "qwen"]).default("local-template"),
  model: z.string().max(100).default(""),
  merchantId: z.string().min(1).max(64),
  storeId: z.string().min(1).max(64).optional(),
  sessionId: z.string().min(1).max(128).optional(),
  input: z.object({
    dishes: z.array(z.string().min(1).max(64)).min(1).max(5),
    tags: z.array(z.string().min(1).max(64)).max(30),
    message: z.string().max(120),
  }).strict(),
}).strict();
const reviewParamsSchema = z.object({ id: z.string().min(1).max(128) });
const selectSchema = z.object({ content: z.string().min(1).max(1000).optional() }).strict().optional();
const saveSchema = z.object({
  reviewId: z.string().min(1).max(128),
  content: z.string().min(1).max(1000),
}).strict();

export async function registerReviewRoutes(
  app: FastifyInstance,
  store: AppStore,
  generator: ReviewGenerator,
  aiRateLimitMax: number,
  contentBlocklist: string[],
  idempotency: IdempotencyService,
): Promise<void> {
  const service = new ReviewService(store, generator);

  app.post("/api/reviews/generate", {
    config: {
      rateLimit: {
        max: aiRateLimitMax,
        timeWindow: "1 minute",
      },
    },
    schema: {
      tags: ["Review"],
      summary: "基于顾客真实输入生成 3 条差异化评价",
      body: {
        type: "object",
        required: ["merchantId", "input"],
        additionalProperties: false,
        properties: {
          provider: { type: "string", enum: ["local-template", "deepseek", "qwen"] },
          model: { type: "string" },
          merchantId: { type: "string" },
          storeId: { type: "string" },
          sessionId: { type: "string" },
          input: {
            type: "object",
            required: ["dishes", "tags", "message"],
            additionalProperties: false,
            properties: {
              dishes: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
              tags: { type: "array", maxItems: 30, items: { type: "string" } },
              message: { type: "string", maxLength: 120 },
            },
          },
        },
      },
    },
  }, async (request) => {
    const input = generateSchema.parse(request.body);
    assertAllowedUserMessage(input.input.message, contentBlocklist);
    const startedAt = performance.now();
    const key = typeof request.headers["idempotency-key"] === "string"
      ? request.headers["idempotency-key"]
      : undefined;
    const result = await idempotency.run("review-generate", key, () => service.generate(input));
    const durationMs = Math.round(performance.now() - startedAt);
    const usedProvider = result.reviews[0]?.provider ?? "unknown";

    request.log.info({
      merchantId: input.merchantId,
      clientProviderHint: input.provider,
      clientModelHint: input.model || undefined,
      usedProvider,
      usedModel: result.reviews[0]?.model,
      durationMs,
      reviewCount: result.reviews.length,
    }, "Review generation completed");

    return result;
  });

  app.post("/api/reviews/:id/select", {
    schema: {
      tags: ["Review"],
      summary: "选定最终评价",
      params: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
      body: {
        type: "object",
        additionalProperties: false,
        properties: { content: { type: "string", minLength: 1, maxLength: 1000 } },
      },
    },
  }, async (request) => {
    const { id } = reviewParamsSchema.parse(request.params);
    const body = selectSchema.parse(request.body);
    if (body?.content) assertAllowedUserMessage(body.content, contentBlocklist);
    return service.select(id, body?.content);
  });

  app.post("/api/reviews", {
    schema: {
      tags: ["Review"],
      summary: "保存用户确认后的最终评价",
      body: {
        type: "object",
        required: ["reviewId", "content"],
        additionalProperties: false,
        properties: {
          reviewId: { type: "string" },
          content: { type: "string", minLength: 1, maxLength: 1000 },
        },
      },
    },
  }, async (request) => {
    const input = saveSchema.parse(request.body);
    assertAllowedUserMessage(input.content, contentBlocklist);
    return service.select(input.reviewId, input.content);
  });
}
