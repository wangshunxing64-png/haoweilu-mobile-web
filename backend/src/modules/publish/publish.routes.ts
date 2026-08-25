import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { IdempotencyService } from "../../common/idempotency/idempotency.service.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { PublishService } from "./publish.service.ts";

const prepareSchema = z.object({
  sessionId: z.string().min(1).max(128),
  platformId: z.string().min(1).max(64),
}).strict();
const completeSchema = z.object({ sessionId: z.string().min(1).max(128) }).strict();

export async function registerPublishRoutes(
  app: FastifyInstance,
  store: AppStore,
  idempotency: IdempotencyService,
): Promise<void> {
  const service = new PublishService(store);

  app.post("/api/publish/prepare", {
    schema: {
      tags: ["Publish"],
      summary: "准备复制文本和平台跳转参数",
      body: {
        type: "object",
        required: ["sessionId", "platformId"],
        additionalProperties: false,
        properties: { sessionId: { type: "string" }, platformId: { type: "string" } },
      },
    },
  }, async (request) => {
    const input = prepareSchema.parse(request.body);
    const key = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined;
    return idempotency.run("publish-prepare", key, () => service.prepare(input));
  });

  app.post("/api/publish/complete", {
    schema: {
      tags: ["Publish"],
      summary: "用户主动确认已完成第三方发布",
      body: {
        type: "object",
        required: ["sessionId"],
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
  }, async (request) => {
    const input = completeSchema.parse(request.body);
    const key = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined;
    return idempotency.run("publish-complete", key, () => service.complete(input));
  });
}
