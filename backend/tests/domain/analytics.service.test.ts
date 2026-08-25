import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../src/common/errors/app-error.ts";
import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { AnalyticsService } from "../../src/modules/analytics/analytics.service.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

test("AnalyticsService accepts current miniapp event names and strips sensitive raw text fields", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new AnalyticsService(store);

  const event = await service.track({
    merchantId: "liji",
    storeId: "liji-main",
    name: "review_generated",
    payload: {
      reviewCount: 3,
      message: "这段顾客原话不能进埋点",
      nested: {
        content: "评价正文也不能进埋点",
        dishId: "bone-soup",
      },
    },
  });

  assert.deepEqual(event.payload, {
    reviewCount: 3,
    nested: { dishId: "bone-soup" },
  });
});

test("AnalyticsService returns a basic source-compatible conversion funnel", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new AnalyticsService(store);
  for (const name of [
    "scan_open",
    "flow_start",
    "review_generated",
    "review_selected",
    "platform_clicked",
    "reward_claimed",
  ]) {
    await service.track({ merchantId: "liji", name, payload: {} });
  }
  await service.track({ merchantId: "liji", name: "platform_clicked", payload: { platformId: "meituan" } });

  const funnel = await service.funnel({ merchantId: "liji" });

  assert.deepEqual(funnel, {
    scanOpen: 1,
    flowStart: 1,
    reviewGenerated: 1,
    reviewSelected: 1,
    platformClicked: 2,
    rewardClaimed: 1,
  });
});

test("AnalyticsService summarizes AI generations and platform click distribution", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const service = new AnalyticsService(store);

  await service.track({ merchantId: "liji", name: "review_generated", payload: { reviewCount: 3 } });
  await service.track({ merchantId: "liji", name: "platform_clicked", payload: { platformId: "dianping" } });
  await service.track({ merchantId: "liji", name: "platform_clicked", payload: { platformId: "dianping" } });
  await service.track({ merchantId: "liji", name: "platform_clicked", payload: { platformId: "meituan" } });

  const summary = await service.summary({ merchantId: "liji" });
  assert.equal(summary.aiGenerateCount, 1);
  assert.deepEqual(summary.platformClicks, { dianping: 2, meituan: 1 });
});

test("AnalyticsService rejects a sessionId that belongs to another merchant", async () => {
  const otherMerchant = structuredClone(lijiMerchantSeed);
  otherMerchant.id = "other";
  otherMerchant.name = "其他商户";
  otherMerchant.storageKey = "other-merchant";
  if (otherMerchant.store) otherMerchant.store.id = "other-main";
  const store = new InMemoryStore([lijiMerchantSeed, otherMerchant]);
  const session = await store.createSession({ merchantId: "liji", storeId: "liji-main" });
  const service = new AnalyticsService(store);

  await assert.rejects(
    () => service.track({ merchantId: "other", sessionId: session.id, name: "flow_start", payload: {} }),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_MERCHANT_MISMATCH",
  );
});
