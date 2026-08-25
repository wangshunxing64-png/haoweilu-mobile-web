import { buildApp, type HttpAppConfig } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { createPrismaClient } from "./infrastructure/database/prisma.ts";
import { PrismaStore } from "./infrastructure/database/prisma-store.ts";
import { createRedisClient } from "./infrastructure/redis/redis.ts";
import { cleanupExpiredSessions } from "./modules/sessions/session-cleanup.ts";

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
});
const store = new PrismaStore(prisma);

let redis = createRedisClient(env.REDIS_URL);
let redisReady = false;
try {
  await redis.connect();
  redisReady = true;
} catch {
  redis.disconnect();
}

const config: HttpAppConfig = {
  corsOrigins: env.corsOrigins,
  logLevel: env.LOG_LEVEL,
  enableApiDocs: env.ENABLE_API_DOCS,
  publicApiBaseUrl: env.PUBLIC_API_BASE_URL,
  trustProxy: env.TRUST_PROXY,
  globalRateLimitMax: env.GLOBAL_RATE_LIMIT_MAX,
  aiRateLimitMax: env.AI_RATE_LIMIT_MAX,
  adminApiKey: env.ADMIN_API_KEY,
  deepseekApiKey: env.DEEPSEEK_API_KEY,
  deepseekBaseUrl: env.DEEPSEEK_BASE_URL,
  deepseekModel: env.DEEPSEEK_MODEL,
  deepseekTimeoutMs: env.DEEPSEEK_TIMEOUT_MS,
  contentBlocklist: env.contentBlocklist,
};

const app = await buildApp({
  store,
  prisma,
  config,
  ...(redisReady ? { redis } : {}),
});

if (!redisReady) {
  app.log.warn("Redis unavailable at startup; rate limiting and idempotency fall back to per-process memory");
}

const cleanupTimer = setInterval(async () => {
  try {
    const removed = await cleanupExpiredSessions(store);
    if (removed > 0) app.log.info({ removed }, "Expired review sessions cleaned");
  } catch (error) {
    app.log.error({ err: error }, "Expired session cleanup failed");
  }
}, env.SESSION_CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

app.addHook("onClose", async () => {
  clearInterval(cleanupTimer);
  if (redisReady) {
    await redis.quit().catch(() => undefined);
  }
  await prisma.$disconnect();
});

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info({ signal }, "Graceful shutdown started");
  try {
    await app.close();
  } catch (error) {
    app.log.error({ err: error }, "Graceful shutdown failed");
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

try {
  await store.healthCheck();
  app.log.info("PostgreSQL connection verified");
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error({ err: error }, "Server startup failed");
  await app.close().catch(() => undefined);
  process.exitCode = 1;
}
