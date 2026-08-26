import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadEnv } from "../../src/config/env.ts";

test("AI_PROVIDER is the production AI provider setting", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    PORT: "8080",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/reviews",
    DEEPSEEK_API_KEY: "server-only-key",
    AI_PROVIDER: "deepseek",
  });

  assert.equal(env.AI_PROVIDER, "deepseek");
  assert.equal(env.ENABLE_API_DOCS, false);
});

test("SiliconFlow is accepted as the production provider with safe official defaults", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/reviews",
    AI_PROVIDER: "siliconflow",
    SILICONFLOW_API_KEY: "server-only-key",
  });

  assert.equal(env.AI_PROVIDER, "siliconflow");
  assert.equal(env.SILICONFLOW_BASE_URL, "https://api.siliconflow.cn/v1");
  assert.equal(env.SILICONFLOW_MODEL, "Qwen/Qwen3-8B");
  assert.equal(env.SILICONFLOW_TIMEOUT_MS, 15000);
});

test("Zhipu remains accepted as an optional production provider", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/reviews",
    AI_PROVIDER: "zhipu",
    ZHIPU_API_KEY: "server-only-key",
  });

  assert.equal(env.AI_PROVIDER, "zhipu");
  assert.equal(
    env.ZHIPU_BASE_URL,
    "https://open.bigmodel.cn/api/paas/v4",
  );
  assert.equal(env.ZHIPU_MODEL, "glm-4.7-flash");
});

test("production deployment files target Node 20 and configure SiliconFlow without tracked secrets", async () => {
  const [dockerfile, environment, gitignore, renderYaml] = await Promise.all([
    readFile(new URL("../../Dockerfile", import.meta.url), "utf8"),
    readFile(new URL("../../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../../.gitignore", import.meta.url), "utf8"),
    readFile(new URL("../../../render.yaml", import.meta.url), "utf8"),
  ]);

  assert.match(dockerfile, /FROM node:20-alpine/);

  assert.match(environment, /^NODE_ENV=production$/m);
  assert.match(environment, /^PORT=3000$/m);
  assert.match(environment, /^DATABASE_URL=$/m);

  assert.match(environment, /^AI_PROVIDER=siliconflow$/m);
  assert.match(environment, /^DEFAULT_AI_PROVIDER=siliconflow$/m);

  assert.match(environment, /^SILICONFLOW_API_KEY=$/m);
  assert.match(
    environment,
    /^SILICONFLOW_BASE_URL=https:\/\/api\.siliconflow\.cn\/v1$/m,
  );
  assert.match(environment, /^SILICONFLOW_MODEL=Qwen\/Qwen3-8B$/m);
  assert.match(environment, /^SILICONFLOW_TIMEOUT_MS=15000$/m);

  assert.match(environment, /^DEEPSEEK_API_KEY=$/m);
  assert.match(environment, /^DEEPSEEK_MODEL=deepseek-v4-flash$/m);

  assert.match(environment, /^ZHIPU_API_KEY=$/m);

  assert.doesNotMatch(environment, /sk-[A-Za-z0-9_-]{8,}/);
  assert.doesNotMatch(environment, /postgresql:\/\/ai_review:ai_review/);

  assert.match(gitignore, /^.env.\*$/m);
  assert.match(gitignore, /^!.env.example$/m);

  assert.match(
    renderYaml,
    /-\s+key:\s+AI_PROVIDER\s+value:\s+siliconflow/,
  );
  assert.match(
    renderYaml,
    /-\s+key:\s+DEFAULT_AI_PROVIDER\s+value:\s+siliconflow/,
  );

  assert.match(
    renderYaml,
    /-\s+key:\s+SILICONFLOW_API_KEY\s+sync:\s+false/,
  );
  assert.match(
    renderYaml,
    /-\s+key:\s+SILICONFLOW_MODEL\s+value:\s+Qwen\/Qwen3-8B/,
  );

  assert.match(
    renderYaml,
    /-\s+key:\s+DEEPSEEK_API_KEY\s+sync:\s+false/,
  );
  assert.match(
    renderYaml,
    /-\s+key:\s+DEEPSEEK_MODEL\s+value:\s+deepseek-v4-flash/,
  );

  assert.doesNotMatch(renderYaml, /sk-[A-Za-z0-9_-]{8,}/);
});

test("production dependencies include the TypeScript seed runner", async () => {
  const packageJson = JSON.parse(
    await readFile(
      new URL("../../package.json", import.meta.url),
      "utf8",
    ),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal(packageJson.dependencies?.tsx, "4.20.5");
  assert.equal(packageJson.dependencies?.prisma, "7.9.1");

  assert.equal(packageJson.devDependencies?.tsx, undefined);
  assert.equal(packageJson.devDependencies?.prisma, undefined);
});