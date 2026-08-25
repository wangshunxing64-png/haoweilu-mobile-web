import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { IdempotencyService } from "../../common/idempotency/idempotency.service.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { SessionService } from "./session.service.ts";

const createSchema = z.object({
  merchantId: z.string().min(1).max(64),
  storeId: z.string().min(1).max(64).optional(),
}).strict();
const idParamsSchema = z.object({ id: z.string().min(1).max(128) });
const updateSchema = z.object({
  dishIds: z.array(z.string().min(1).max(64)).max(5).optional(),
  tagIds: z.array(z.string().min(1).max(64)).max(30).optional(),
  message: z.string().max(120).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "至少提交一个可更新字段");

export async function registerSessionRoutes(
  app: FastifyInstance,
  store: AppStore,
  idempotency: IdempotencyService,
): Promise<void> {
  const service = new SessionService(store);

  app.post("/api/sessions", {
    schema: {
      tags: ["Session"],
      summary: "创建匿名评价会话",
      body: {
        type: "object",
        required: ["merchantId"],
        additionalProperties: false,
        properties: { merchantId: { type: "string" }, storeId: { type: "string" } },
      },
    },
  }, async (request, reply) => {
    const input = createSchema.parse(request.body);
    const key = typeof request.headers["idempotency-key"] === "string"
      ? request.headers["idempotency-key"]
      : undefined;
    const session = await idempotency.run("session-create", key, () => service.create(input));
    return reply.code(201).send(session);
  });

  app.get("/api/sessions/:id", {
    schema: {
      tags: ["Session"],
      summary: "查询评价会话",
      params: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    },
  }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    return service.get(id);
  });

  app.patch("/api/sessions/:id", {
    schema: {
      tags: ["Session"],
      summary: "更新用户选择与补充内容",
      params: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
      body: {
        type: "object",
        additionalProperties: false,
        properties: {
          dishIds: { type: "array", maxItems: 5, items: { type: "string" } },
          tagIds: { type: "array", maxItems: 30, items: { type: "string" } },
          message: { type: "string", maxLength: 120 },
        },
      },
    },
  }, async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    const patch = updateSchema.parse(request.body);
    return service.update(id, patch);
  });
}
