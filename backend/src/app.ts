import { randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import type { Redis } from "ioredis";

import { DeepSeekProvider } from "./ai/providers/deepseek.provider.ts";
import { LocalFallbackProvider } from "./ai/providers/local-fallback.provider.ts";
import { QwenProvider } from "./ai/providers/qwen.provider.ts";
import { ZhipuProvider } from "./ai/providers/zhipu.provider.ts";
import { SiliconFlowProvider } from "./ai/providers/siliconflow.provider.ts";
import { ReviewGenerator } from "./ai/review-generator.ts";
import type { ReviewProvider } from "./ai/types.ts";
import { registerErrorHandler } from "./common/http/error-handler.ts";
import { IdempotencyService } from "./common/idempotency/idempotency.service.ts";
import type { AppStore } from "./infrastructure/database/store.ts";
import type { PrismaClient } from "./generated/prisma/client.js";
import { registerAnalyticsRoutes } from "./modules/analytics/analytics.routes.ts";
import { registerConfigRoutes } from "./modules/config/config.routes.ts";
import { registerMerchantRoutes } from "./modules/merchants/merchant.routes.ts";
import { registerPublishRoutes } from "./modules/publish/publish.routes.ts";
import { registerReviewRoutes } from "./modules/reviews/review.routes.ts";
import { registerRewardRoutes } from "./modules/rewards/reward.routes.ts";
import { registerSessionRoutes } from "./modules/sessions/session.routes.ts";

export interface HttpAppConfig {
  corsOrigins: string[];
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  enableApiDocs?: boolean;
  publicApiBaseUrl: string;
  trustProxy?: boolean;
  globalRateLimitMax: number;
  aiRateLimitMax: number;
  adminApiKey: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  deepseekTimeoutMs: number;
  zhipuApiKey: string;
  zhipuBaseUrl: string;
  zhipuModel: string;
  zhipuTimeoutMs: number;
  siliconflowApiKey: string;
  siliconflowBaseUrl: string;
  siliconflowModel: string;
  siliconflowTimeoutMs: number;
  contentBlocklist: string[];
}

export interface BuildAppOptions {
  store: AppStore;
  config: HttpAppConfig;
  prisma?: PrismaClient;
  reviewGenerator?: ReviewGenerator;
  redis?: Redis;
  logger?: boolean;
}

function normalizedRequestId(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && /^[A-Za-z0-9._:-]{1,128}$/.test(candidate)) return candidate;
  return randomUUID();
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { config, store } = options;
  const app = Fastify({
    logger: options.logger === false
      ? false
      : {
          level: config.logLevel,
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers.x-api-key",
            "req.headers.x-admin-key",
          ],
        },
    genReqId: (request) => normalizedRequestId(request.headers["x-request-id"]),
    bodyLimit: 64 * 1024,
    trustProxy: config.trustProxy ?? false,
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  registerErrorHandler(app);

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["content-type", "x-request-id", "x-admin-key", "idempotency-key"],
  });

  await app.register(rateLimit, {
    global: true,
    max: config.globalRateLimitMax,
    timeWindow: "1 minute",
    skipOnError: true,
    ...(options.redis ? { redis: options.redis } : {}),
  });

  if (config.enableApiDocs) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: "AI 餐饮评价助手 API",
          description: "面向微信小程序 / H5 的餐饮真实体验评价服务",
          version: "0.1.0",
        },
        tags: [
          { name: "System", description: "服务状态" },
          { name: "Merchant", description: "商户配置" },
          { name: "Session", description: "评价会话" },
          { name: "Review", description: "AI 评价" },
          { name: "Publish", description: "平台发布" },
          { name: "Reward", description: "奖励" },
          { name: "Analytics", description: "埋点" },
          { name: "Admin", description: "运营统计" },
        ],
      },
    });
    await app.register(swaggerUi, { routePrefix: "/docs" });
  }

  app.get("/health", {
    config: { rateLimit: false },
    schema: { tags: ["System"], summary: "服务存活检查" },
  }, async () => ({
    status: "ok",
    service: "ai-restaurant-review-backend",
    timestamp: new Date().toISOString(),
  }));

  app.get("/ready", {
    config: { rateLimit: false },
    schema: { tags: ["System"], summary: "数据库就绪检查" },
  }, async (request, reply) => {
    try {
      await store.healthCheck();
      return {
        status: "ready",
        database: "ok",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      request.log.warn({
        reason: error instanceof Error ? error.message : "database health check failed",
      }, "Database readiness check failed");
      return reply.code(503).send({
        status: "not_ready",
        database: "unavailable",
        requestId: request.id,
      });
    }
  });

  const fallback = new LocalFallbackProvider();
  const generator = options.reviewGenerator ?? new ReviewGenerator({
    providers: new Map<string, ReviewProvider>([
        ["siliconflow", new SiliconFlowProvider({
          apiKey: config.siliconflowApiKey,
          baseUrl: config.siliconflowBaseUrl,
          model: config.siliconflowModel,
          timeoutMs: config.siliconflowTimeoutMs,
      })],
      ["deepseek", new DeepSeekProvider({
        apiKey: config.deepseekApiKey,
        baseUrl: config.deepseekBaseUrl,
        model: config.deepseekModel,
        timeoutMs: config.deepseekTimeoutMs,
      })],
      ["zhipu", new ZhipuProvider({
        apiKey: config.zhipuApiKey,
        baseUrl: config.zhipuBaseUrl,
        model: config.zhipuModel,
        timeoutMs: config.zhipuTimeoutMs,
      })],
      ["qwen", new QwenProvider()],
    ]),
    fallback,
    failoverProviders: new Map([
  ["siliconflow", "deepseek"],
  ["zhipu", "deepseek"],
]),
    onProviderFailure: ({ provider, error }) => {
      app.log.warn({
        provider,
        reason: error instanceof Error ? error.message : "unknown provider failure",
      }, "AI provider failed");
    },
  });

  const idempotency = new IdempotencyService(options.redis);

  if (options.prisma) {
    await registerConfigRoutes(app, options.prisma);
  }
  await registerMerchantRoutes(app, store, config.publicApiBaseUrl);
  await registerSessionRoutes(app, store, idempotency);
  await registerReviewRoutes(app, store, generator, config.aiRateLimitMax, config.contentBlocklist, idempotency);
  await registerPublishRoutes(app, store, idempotency);
  await registerRewardRoutes(app, store, idempotency);
  await registerAnalyticsRoutes(app, store, config.adminApiKey, idempotency);

  return app;
}
