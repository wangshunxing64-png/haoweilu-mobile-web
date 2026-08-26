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

test("Zhipu is accepted as a production provider with safe official defaults", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/reviews",
    AI_PROVIDER: "zhipu",
    ZHIPU_API_KEY: "server-only-key",
  });

  assert.equal(env.AI_PROVIDER, "zhipu");
  assert.equal(env.ZHIPU_BASE_URL, "https://open.bigmodel.cn/api/paas/v4");
  assert.equal(env.ZHIPU_MODEL, "glm-4.7-flash");
});

test("production deployment files target Node 20 without tracked secrets", async () => {
  const [dockerfile, environment, gitignore] = await Promise.all([
    readFile(new URL("../../Dockerfile", import.meta.url), "utf8"),
    readFile(new URL("../../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../../.gitignore", import.meta.url), "utf8"),
  ]);

  assert.match(dockerfile, /FROM node:20-alpine/);
  assert.match(environment, /^NODE_ENV=production$/m);
  assert.match(environment, /^PORT=3000$/m);
  assert.match(environment, /^DATABASE_URL=$/m);
  assert.match(environment, /^ZHIPU_API_KEY=$/m);
  assert.match(environment, /^AI_PROVIDER=zhipu$/m);
  assert.doesNotMatch(environment, /postgresql:\/\/ai_review:ai_review/);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
});

test("production dependencies include the TypeScript seed runner", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

  assert.equal(packageJson.dependencies?.tsx, "4.20.5");
  assert.equal(packageJson.dependencies?.prisma, "7.9.1");
  assert.equal(packageJson.devDependencies?.tsx, undefined);
  assert.equal(packageJson.devDependencies?.prisma, undefined);
});
