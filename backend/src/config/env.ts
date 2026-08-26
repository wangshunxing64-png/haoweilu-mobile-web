import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(5000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(30000),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000"),
  PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  ENABLE_API_DOCS: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  AI_PROVIDER: z.enum([
  "local-template",
  "deepseek",
  "zhipu",
  "qwen",
  "siliconflow",
]).default("siliconflow"),

DEFAULT_AI_PROVIDER: z.enum([
  "local-template",
  "deepseek",
  "zhipu",
  "qwen",
  "siliconflow",
]).optional(),
  DEEPSEEK_API_KEY: z.string().default(""),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().min(1).default("deepseek-v4-flash"),
  DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(12000),
  ZHIPU_API_KEY: z.string().default(""),
  ZHIPU_BASE_URL: z.string().url().default("https://open.bigmodel.cn/api/paas/v4"),
  ZHIPU_MODEL: z.string().min(1).default("glm-4.7-flash"),
  ZHIPU_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(12000),
  SILICONFLOW_API_KEY: z.string().default(""),
  SILICONFLOW_BASE_URL: z.string().url().default("https://api.siliconflow.cn/v1"),
  SILICONFLOW_MODEL: z.string().min(1).default("Qwen/Qwen3-8B"),
  SILICONFLOW_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
  SESSION_CLEANUP_INTERVAL_MS: z.coerce.number().int().min(60000).default(3600000),
  ADMIN_API_KEY: z.string().default(""),
  CONTENT_BLOCKLIST: z.string().default(""),
});

export type AppEnv = z.infer<typeof envSchema> & { corsOrigins: string[]; contentBlocklist: string[] };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(source);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean),
    contentBlocklist: parsed.CONTENT_BLOCKLIST.split(",").map((item) => item.trim()).filter(Boolean),
  };
}
