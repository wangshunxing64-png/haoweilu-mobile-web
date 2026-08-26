import assert from "node:assert/strict";
import test from "node:test";

import { LocalFallbackProvider } from "../../src/ai/providers/local-fallback.provider.ts";
import { ReviewGenerator } from "../../src/ai/review-generator.ts";
import { buildApp, type HttpAppConfig } from "../../src/app.ts";
import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

const config: HttpAppConfig = {
  corsOrigins: ["http://localhost:5173"],
  logLevel: "silent",
  publicApiBaseUrl: "http://localhost:3000",
  globalRateLimitMax: 300,
  aiRateLimitMax: 20,
  adminApiKey: "test-admin-key",
  deepseekApiKey: "",
  deepseekBaseUrl: "https://api.deepseek.com",
  deepseekModel: "deepseek-v4-flash",
  deepseekTimeoutMs: 12000,
  zhipuApiKey: "",
  zhipuBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
  zhipuModel: "glm-4.7-flash",
  zhipuTimeoutMs: 12000,
  siliconflowApiKey: "",
  siliconflowBaseUrl: "https://api.siliconflow.cn/v1",
  siliconflowModel: "Qwen/Qwen3-8B",
  siliconflowTimeoutMs: 15000,
  contentBlocklist: [],
};

async function createTestApp() {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const generator = new ReviewGenerator({
    providers: new Map(),
    fallback: new LocalFallbackProvider(),
  });
  const app = await buildApp({ store, config, reviewGenerator: generator, logger: false });
  return { app, store };
}

test("GET /health returns status and preserves x-request-id", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: "GET",
    url: "/health",
    headers: { "x-request-id": "source-test-request" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["x-request-id"], "source-test-request");
  assert.equal(response.json().status, "ok");
});


test("GET /ready confirms the backing store is reachable", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, "ready");
  assert.equal(response.json().database, "ok");
});

test("API documentation is disabled unless explicitly enabled", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());
  assert.equal((await app.inject({ method: "GET", url: "/docs" })).statusCode, 404);

  const docsApp = await buildApp({
    store: new InMemoryStore([lijiMerchantSeed]),
    config: { ...config, enableApiDocs: true },
    reviewGenerator: new ReviewGenerator({ providers: new Map(), fallback: new LocalFallbackProvider() }),
    logger: false,
  });
  t.after(() => docsApp.close());
  assert.equal((await docsApp.inject({ method: "GET", url: "/docs" })).statusCode, 200);
});

test("GET /api/merchants/liji returns source-compatible merchant configuration", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/api/merchants/liji?storeId=liji-main" });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.id, "liji");
  assert.equal(body.name, "李记好味道");
  assert.equal(body.dishes.length, 6);
  assert.equal(body.ai.endpoint, "http://localhost:3000/api/reviews/generate");
});

test("POST /api/reviews/generate accepts the existing miniapp request contract", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/reviews/generate",
    payload: {
      provider: "local-template",
      model: "",
      merchantId: "liji",
      input: {
        dishes: ["pickled-pork"],
        tags: ["tasty", "generous"],
        message: "朋友推荐来的，酸菜蹄膀很香",
      },
    },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(typeof body.sessionId, "string");
  assert.equal(body.reviews.length, 3);
  assert.match(body.reviews[0].content, /酸菜蹄膀/);
});

test("POST /api/reviews persists the selected final review content", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const generated = await app.inject({
    method: "POST",
    url: "/api/reviews/generate",
    payload: {
      merchantId: "liji",
      input: {
        dishes: ["bone-soup"],
        tags: ["broth"],
        message: "第一次来",
      },
    },
  });
  const reviewId = generated.json().reviews[0].id;

  const response = await app.inject({
    method: "POST",
    url: "/api/reviews",
    payload: { reviewId, content: "骨汤烫菜很合胃口，下次还会再来。" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().id, reviewId);
  assert.equal(response.json().content, "骨汤烫菜很合胃口，下次还会再来。");
  assert.equal(response.json().selected, true);
});

test("full publish and reward flow is idempotent for the same session", async (t) => {
  const { app } = await createTestApp();
  t.after(() => app.close());

  const sessionResponse = await app.inject({
    method: "POST",
    url: "/api/sessions",
    payload: { merchantId: "liji", storeId: "liji-main" },
  });
  const sessionId = sessionResponse.json().id;

  const generatedResponse = await app.inject({
    method: "POST",
    url: "/api/reviews/generate",
    payload: {
      provider: "local-template",
      model: "",
      merchantId: "liji",
      storeId: "liji-main",
      sessionId,
      input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
    },
  });
  const reviewId = generatedResponse.json().reviews[0].id;

  assert.equal((await app.inject({
    method: "POST",
    url: `/api/reviews/${reviewId}/select`,
    payload: { content: generatedResponse.json().reviews[0].content },
  })).statusCode, 200);

  assert.equal((await app.inject({
    method: "POST",
    url: "/api/publish/prepare",
    payload: { sessionId, platformId: "dianping" },
  })).statusCode, 200);

  assert.equal((await app.inject({
    method: "POST",
    url: "/api/publish/complete",
    payload: { sessionId },
  })).statusCode, 200);

  const firstReward = await app.inject({
    method: "POST",
    url: "/api/rewards/claim",
    payload: { sessionId },
  });
  const repeatedReward = await app.inject({
    method: "POST",
    url: "/api/rewards/claim",
    payload: { sessionId },
  });

  assert.equal(firstReward.statusCode, 200);
  assert.equal(repeatedReward.statusCode, 200);
  assert.equal(firstReward.json().id, repeatedReward.json().id);
  assert.equal(firstReward.json().code, repeatedReward.json().code);
});

test("analytics endpoint strips raw user content and admin funnel requires key", async (t) => {
  const { app, store } = await createTestApp();
  t.after(() => app.close());

  const event = await app.inject({
    method: "POST",
    url: "/api/events",
    payload: {
      merchantId: "liji",
      name: "review_generated",
      payload: { reviewCount: 3, message: "不应该进入日志或埋点" },
    },
  });
  assert.equal(event.statusCode, 201);
  const persisted = await store.listAnalyticsEvents({ merchantId: "liji" });
  assert.deepEqual(persisted[0].payload, { reviewCount: 3 });

  const denied = await app.inject({
    method: "GET",
    url: "/api/admin/analytics/funnel?merchantId=liji",
  });
  assert.equal(denied.statusCode, 401);

  const allowed = await app.inject({
    method: "GET",
    url: "/api/admin/analytics/funnel?merchantId=liji",
    headers: { "x-admin-key": "test-admin-key" },
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.json().reviewGenerated, 1);
});
