import assert from "node:assert/strict";
import test from "node:test";

import { ReviewGenerator } from "../../src/ai/review-generator.ts";
import { LocalFallbackProvider } from "../../src/ai/providers/local-fallback.provider.ts";
import { AppError } from "../../src/common/errors/app-error.ts";
import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";
import { ReviewService } from "../../src/modules/reviews/review.service.ts";
import { SessionService } from "../../src/modules/sessions/session.service.ts";

test("SessionService creates and updates an anonymous source-compatible session", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new SessionService(store);

  const session = await service.create({ merchantId: "liji", storeId: "liji-main" });
  assert.equal(session.merchantId, "liji");
  assert.deepEqual(session.dishIds, []);
  assert.deepEqual(session.tagIds, []);
  assert.equal(session.status, "CREATED");

  const updated = await service.update(session.id, {
    dishIds: ["bone-soup", "pickled-pork"],
    tagIds: ["broth", "warm-service"],
    message: "汤底很香",
  });

  assert.deepEqual(updated.dishIds, ["bone-soup", "pickled-pork"]);
  assert.deepEqual(updated.tagIds, ["broth", "warm-service"]);
  assert.equal(updated.message, "汤底很香");
  assert.equal(updated.status, "INTERVIEWING");
});

test("SessionService rejects dish and tag ids outside the merchant configuration", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new SessionService(store);
  const session = await service.create({ merchantId: "liji" });

  await assert.rejects(
    () => service.update(session.id, { dishIds: ["unknown-dish"] }),
    (error: unknown) => error instanceof AppError && error.code === "INVALID_DISH_SELECTION",
  );

  await assert.rejects(
    () => service.update(session.id, { tagIds: ["unknown-tag"] }),
    (error: unknown) => error instanceof AppError && error.code === "INVALID_TAG_SELECTION",
  );
});

test("SessionService enforces max dish count and message length from merchant rules", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new SessionService(store);
  const session = await service.create({ merchantId: "liji" });

  await assert.rejects(
    () => service.update(session.id, {
      dishIds: [...lijiMerchantSeed.dishes.map((dish) => dish.id), "seventh-dish"],
    }),
    (error: unknown) => error instanceof AppError && error.code === "DISH_SELECTION_LIMIT_EXCEEDED",
  );

  await assert.rejects(
    () => service.update(session.id, { message: "太".repeat(121) }),
    (error: unknown) => error instanceof AppError && error.code === "MESSAGE_TOO_LONG",
  );
});

test("requires at least one dish before review generation", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const generator = new ReviewGenerator({
    providers: new Map(),
    fallback: new LocalFallbackProvider(),
  });
  const service = new ReviewService(store, generator);

  await assert.rejects(
    () => service.generate({
      provider: "local-template",
      model: "",
      merchantId: "liji",
      input: { dishes: [], tags: [], message: "" },
    }),
    (error: unknown) => error instanceof AppError && error.code === "DISH_SELECTION_REQUIRED",
  );
});

test("SessionService rejects expired sessions even before scheduled cleanup runs", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new SessionService(store);
  const session = await store.createSession({ merchantId: "liji", storeId: "liji-main" });
  const originalGetSession = store.getSession.bind(store);
  store.getSession = async (id: string) => {
    const record = await originalGetSession(id);
    return record ? { ...record, expiresAt: new Date(Date.now() - 1_000) } : null;
  };

  await assert.rejects(
    () => service.get(session.id),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_EXPIRED",
  );
});

test("ReviewService uses the merchant-configured AI provider instead of trusting the client provider field", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  let remoteCalls = 0;
  const generator = new ReviewGenerator({
    providers: new Map([["deepseek", {
      name: "deepseek",
      async generate() {
        remoteCalls += 1;
        return [
          { id: "a", styleId: "daily", styleName: "", styleLabel: "", content: "远端一" },
          { id: "b", styleId: "friend", styleName: "", styleLabel: "", content: "远端二" },
          { id: "c", styleId: "local", styleName: "", styleLabel: "", content: "远端三" },
        ];
      },
    }]]),
    fallback: new LocalFallbackProvider(),
  });
  const service = new ReviewService(store, generator);

  const result = await service.generate({
    provider: "local-template",
    model: "client-supplied-model-is-ignored",
    merchantId: "liji",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });

  assert.equal(remoteCalls, 1);
  assert.ok(result.reviews.every((review) => review.provider === "deepseek"));
});

test("SessionService stores the canonical store id returned by merchant resolution", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const originalGetMerchant = store.getMerchant.bind(store);
  const originalCreateSession = store.createSession.bind(store);
  let persistedStoreId: string | undefined;

  store.getMerchant = async (merchantId: string, _storeId?: string) => {
    const merchant = await originalGetMerchant(merchantId);
    return merchant ? { ...merchant, store: { id: "canonical-store-id", name: "规范门店" } } : null;
  };
  store.createSession = async (input) => {
    persistedStoreId = input.storeId;
    return originalCreateSession(input);
  };

  const service = new SessionService(store);
  await service.create({ merchantId: "liji", storeId: "public-store-alias" });

  assert.equal(persistedStoreId, "canonical-store-id");
});

test("ReviewService accepts a public store alias after resolving it to the canonical store id", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const originalGetMerchant = store.getMerchant.bind(store);
  store.getMerchant = async (merchantId: string, _storeId?: string) => {
    const merchant = await originalGetMerchant(merchantId);
    return merchant ? { ...merchant, store: { id: "canonical-store-id", name: "规范门店" } } : null;
  };

  const service = new ReviewService(store, new ReviewGenerator({
    providers: new Map(),
    fallback: new LocalFallbackProvider(),
  }));

  const result = await service.generate({
    provider: "local-template",
    model: "",
    merchantId: "liji",
    storeId: "public-store-alias",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });

  assert.equal(result.reviews.length, 3);
});
