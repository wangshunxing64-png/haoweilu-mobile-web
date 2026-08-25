import assert from "node:assert/strict";
import test from "node:test";

import { ReviewGenerator } from "../../src/ai/review-generator.ts";
import { LocalFallbackProvider } from "../../src/ai/providers/local-fallback.provider.ts";
import { AppError } from "../../src/common/errors/app-error.ts";
import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";
import { PublishService } from "../../src/modules/publish/publish.service.ts";
import { RewardService } from "../../src/modules/rewards/reward.service.ts";
import { ReviewService } from "../../src/modules/reviews/review.service.ts";

function makeServices() {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const generator = new ReviewGenerator({
    providers: new Map(),
    fallback: new LocalFallbackProvider(),
  });
  return {
    store,
    reviews: new ReviewService(store, generator),
    publish: new PublishService(store),
    rewards: new RewardService(store, () => "A7K29P"),
  };
}

test("full persisted flow: generate -> select -> prepare -> confirm -> claim reward", async () => {
  const { reviews, publish, rewards } = makeServices();

  const generated = await reviews.generate({
    provider: "local-template",
    model: "",
    merchantId: "liji",
    input: {
      dishes: ["bone-soup", "pickled-pork"],
      tags: ["broth", "warm-service"],
      message: "朋友推荐来的，汤底很香。",
    },
  });

  assert.equal(generated.reviews.length, 3);
  assert.ok(generated.sessionId);

  const selected = await reviews.select(generated.reviews[0].id);
  assert.equal(selected.selected, true);

  const prepared = await publish.prepare({
    sessionId: generated.sessionId,
    platformId: "dianping",
  });
  assert.equal(prepared.platformName, "大众点评");
  assert.equal(prepared.platform, "dianping");
  assert.equal(prepared.action, "open_app");
  assert.equal(prepared.scheme, "dianping://");
  assert.equal(prepared.copyText, prepared.text);
  assert.equal(prepared.text, selected.content);

  const completed = await publish.complete({ sessionId: generated.sessionId });
  assert.equal(completed.userConfirmed, true);

  const reward = await rewards.claim(generated.sessionId);
  assert.equal(reward.code, "A7K29P");
  assert.equal(reward.rewardType, "FREE_DRINK_OR_SIDE");
});

test("reward claim is idempotent per session", async () => {
  const { reviews, publish, rewards } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "meituan" });
  await publish.complete({ sessionId: generated.sessionId });

  const first = await rewards.claim(generated.sessionId);
  const second = await rewards.claim(generated.sessionId);

  assert.equal(second.id, first.id);
  assert.equal(second.code, first.code);
});

test("reward cannot be claimed before user-confirmed publish completion", async () => {
  const { reviews, rewards } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: [], message: "" },
  });

  await assert.rejects(
    () => rewards.claim(generated.sessionId),
    (error: unknown) => error instanceof AppError && error.code === "PUBLISH_NOT_CONFIRMED",
  );
});

test("selected review can persist the user's final edited content before publish", async () => {
  const { reviews, publish } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["pickled-pork"], tags: ["tasty"], message: "酸菜蹄膀很香" },
  });

  const selected = await reviews.select(generated.reviews[0].id, "酸菜蹄膀很香，口味是我喜欢的。 ");
  const prepared = await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });

  assert.equal(selected.content, "酸菜蹄膀很香，口味是我喜欢的。");
  assert.equal(prepared.text, selected.content);
});

test("completed or rewarded sessions cannot be regenerated or have publish preparation reset", async () => {
  const { reviews, publish, rewards } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });
  await publish.complete({ sessionId: generated.sessionId });
  await rewards.claim(generated.sessionId);

  await assert.rejects(
    () => reviews.generate({
      merchantId: "liji",
      provider: "local-template",
      model: "",
      sessionId: generated.sessionId,
      input: { dishes: ["bone-soup"], tags: [], message: "重新生成" },
    }),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_LOCKED",
  );

  await assert.rejects(
    () => publish.prepare({ sessionId: generated.sessionId, platformId: "meituan" }),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_LOCKED",
  );
});

test("repeating publish completion after reward is idempotent and never downgrades the session status", async () => {
  const { store, reviews, publish, rewards } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });
  const first = await publish.complete({ sessionId: generated.sessionId });
  await rewards.claim(generated.sessionId);
  const second = await publish.complete({ sessionId: generated.sessionId });
  const session = await store.getSession(generated.sessionId);

  assert.equal(second.id, first.id);
  assert.equal(second.userConfirmed, true);
  assert.equal(session?.status, "REWARDED");
});

test("a review cannot be re-selected after the session has entered publish flow", async () => {
  const { reviews, publish } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: [], message: "" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });

  await assert.rejects(
    () => reviews.select(generated.reviews[1].id),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_LOCKED",
  );
});

test("session interview fields are locked once publish preparation starts", async () => {
  const { store, reviews, publish } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });
  const sessions = new (await import("../../src/modules/sessions/session.service.ts")).SessionService(store);

  await assert.rejects(
    () => sessions.update(generated.sessionId, { message: "发布后不应再改采访内容" }),
    (error: unknown) => error instanceof AppError && error.code === "SESSION_LOCKED",
  );
});

test("existing reward repairs session status after a post-insert interruption", async () => {
  const { store, reviews, publish, rewards } = makeServices();
  const generated = await reviews.generate({
    merchantId: "liji",
    provider: "local-template",
    model: "",
    input: { dishes: ["bone-soup"], tags: ["broth"], message: "汤底很香" },
  });
  await reviews.select(generated.reviews[0].id);
  await publish.prepare({ sessionId: generated.sessionId, platformId: "dianping" });
  await publish.complete({ sessionId: generated.sessionId });

  await store.createRewardIfAbsent({
    sessionId: generated.sessionId,
    rewardType: "FREE_DRINK_OR_SIDE",
    code: "RECOV1",
  });

  const reward = await rewards.claim(generated.sessionId);
  const repaired = await store.getSession(generated.sessionId);

  assert.equal(reward.code, "RECOV1");
  assert.equal(repaired?.status, "REWARDED");
});
