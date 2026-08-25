import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { AppError } from "../../common/errors/app-error.ts";
import type { IdempotencyService } from "../../common/idempotency/idempotency.service.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { AnalyticsService } from "./analytics.service.ts";

const eventSchema = z.object({
  merchantId: z.string().min(1).max(64),
  storeId: z.string().min(1).max(64).optional(),
  sessionId: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(64),
  payload: z.record(z.string(), z.unknown()).default({}),
}).strict();

const funnelQuerySchema = z.object({
  merchantId: z.string().min(1).max(64),
  storeId: z.string().min(1).max(64).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export async function registerAnalyticsRoutes(
  app: FastifyInstance,
  store: AppStore,
  adminApiKey: string,
  idempotency: IdempotencyService,
): Promise<void> {
  const service = new AnalyticsService(store);

  app.post("/api/events", {
    schema: {
      tags: ["Analytics"],
      summary: "接收小程序/H5 埋点事件",
      body: {
        type: "object",
        required: ["merchantId", "name"],
        additionalProperties: false,
        properties: {
          merchantId: { type: "string" },
          storeId: { type: "string" },
          sessionId: { type: "string" },
          name: { type: "string" },
          payload: { type: "object", additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const input = eventSchema.parse(request.body);
    const key = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined;
    const event = await idempotency.run("analytics-event", key, () => service.track(input));
    return reply.code(201).send(event);
  });

  app.get("/api/admin/analytics/funnel", {
    schema: {
      tags: ["Admin"],
      summary: "按商户/门店/日期统计核心转化漏斗",
      querystring: {
        type: "object",
        required: ["merchantId"],
        properties: {
          merchantId: { type: "string" }, storeId: { type: "string" },
          dateFrom: { type: "string", format: "date-time" }, dateTo: { type: "string", format: "date-time" },
        },
      },
    },
  }, async (request) => {
    if (!adminApiKey) {
      throw new AppError("ADMIN_API_DISABLED", "后台统计接口未启用", 503);
    }
    if (request.headers["x-admin-key"] !== adminApiKey) {
      throw new AppError("ADMIN_UNAUTHORIZED", "无权访问后台统计接口", 401);
    }
    return service.funnel(funnelQuerySchema.parse(request.query));
  });

  app.get("/api/admin/analytics/summary", {
    schema: {
      tags: ["Admin"],
      summary: "汇总转化漏斗、AI 生成次数与平台点击量",
      querystring: {
        type: "object",
        required: ["merchantId"],
        properties: {
          merchantId: { type: "string" }, storeId: { type: "string" },
          dateFrom: { type: "string", format: "date-time" }, dateTo: { type: "string", format: "date-time" },
        },
      },
    },
  }, async (request) => {
    if (!adminApiKey) {
      throw new AppError("ADMIN_API_DISABLED", "后台统计接口未启用", 503);
    }
    if (request.headers["x-admin-key"] !== adminApiKey) {
      throw new AppError("ADMIN_UNAUTHORIZED", "无权访问后台统计接口", 401);
    }
    return service.summary(funnelQuerySchema.parse(request.query));
  });
}
