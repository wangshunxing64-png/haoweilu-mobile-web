import assert from "node:assert/strict";
import test from "node:test";

import { ReviewGenerator } from "../../src/ai/review-generator.ts";
import { LocalFallbackProvider } from "../../src/ai/providers/local-fallback.provider.ts";
import type { ReviewProvider } from "../../src/ai/types.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

const context = {
  merchant: lijiMerchantSeed,
  input: {
    dishIds: ["bone-soup"],
    tagIds: ["broth"],
    dishes: ["骨汤烫菜"],
    tags: ["汤底鲜香"],
    message: "汤底很香",
  },
};

test("ReviewGenerator accepts a valid remote provider result and normalizes style metadata", async () => {
  const remote: ReviewProvider = {
    name: "deepseek",
    async generate() {
      return [
        { id: "a", styleId: "daily", styleName: "", styleLabel: "", content: "远端日常评价" },
        { id: "b", styleId: "friend", styleName: "", styleLabel: "", content: "远端朋友评价" },
        { id: "c", styleId: "local", styleName: "", styleLabel: "", content: "远端本地评价" },
      ];
    },
  };
  const generator = new ReviewGenerator({
    providers: new Map([[remote.name, remote]]),
    fallback: new LocalFallbackProvider(),
  });

  const result = await generator.generate(context, "deepseek");

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((item) => item.styleName), ["日常分享型", "朋友推荐型", "本地体验型"]);
  assert.ok(result.every((item) => item.provider === "deepseek"));
});

test("ReviewGenerator falls back locally when the remote provider throws", async () => {
  const remote: ReviewProvider = {
    name: "deepseek",
    async generate() {
      throw new Error("upstream unavailable");
    },
  };
  const generator = new ReviewGenerator({
    providers: new Map([[remote.name, remote]]),
    fallback: new LocalFallbackProvider(),
  });

  const result = await generator.generate(context, "deepseek");

  assert.equal(result.length, 3);
  assert.ok(result.every((item) => item.provider === "local-template"));
  assert.ok(result.every((item) => item.content.includes("汤底很香")));
});

test("ReviewGenerator falls back when a provider returns fewer than three or duplicate reviews", async () => {
  const remote: ReviewProvider = {
    name: "deepseek",
    async generate() {
      return [
        { id: "a", styleId: "daily", styleName: "", styleLabel: "", content: "重复" },
        { id: "b", styleId: "friend", styleName: "", styleLabel: "", content: "重复" },
      ];
    },
  };
  const generator = new ReviewGenerator({
    providers: new Map([[remote.name, remote]]),
    fallback: new LocalFallbackProvider(),
  });

  const result = await generator.generate(context, "deepseek");
  assert.equal(result.length, 3);
  assert.ok(result.every((item) => item.provider === "local-template"));
});

test("ReviewGenerator uses local fallback when requested provider is local-template or unknown", async () => {
  const fallback = new LocalFallbackProvider();
  const generator = new ReviewGenerator({ providers: new Map(), fallback });

  const local = await generator.generate(context, "local-template");
  const unknown = await generator.generate(context, "not-supported");

  assert.equal(local.length, 3);
  assert.equal(unknown.length, 3);
  assert.ok(local.every((item) => item.provider === "local-template"));
  assert.ok(unknown.every((item) => item.provider === "local-template"));
});

test("ReviewGenerator reports provider failure without exposing the user message to the callback contract", async () => {
  const failures: Array<{ provider: string; reason: string }> = [];
  const failingProvider = {
    name: "deepseek",
    async generate() {
      throw new Error("upstream unavailable");
    },
  };
  const generator = new ReviewGenerator({
    providers: new Map([["deepseek", failingProvider]]),
    fallback: new LocalFallbackProvider(),
    onProviderFailure: ({ provider, error }) => {
      failures.push({
        provider,
        reason: error instanceof Error ? error.message : "unknown",
      });
    },
  });

  await generator.generate(context, "deepseek");
  assert.deepEqual(failures, [{ provider: "deepseek", reason: "upstream unavailable" }]);
});
