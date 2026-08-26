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
        { id: "a", styleId: "daily", styleName: "", styleLabel: "", content: "远端日常评价".repeat(25) },
        { id: "b", styleId: "friend", styleName: "", styleLabel: "", content: "远端朋友评价".repeat(25) },
        { id: "c", styleId: "local", styleName: "", styleLabel: "", content: "远端本地评价".repeat(25) },
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

test("ReviewGenerator fails over from Zhipu to DeepSeek after any Zhipu request error", async () => {
  for (const zhipuError of [
    Object.assign(new Error("Zhipu request failed: 429"), { status: 429 }),
    new Error("The operation was aborted due to timeout"),
    Object.assign(new Error("Zhipu request failed: 500"), { status: 500 }),
  ]) {
    const zhipu: ReviewProvider = {
      name: "zhipu",
      async generate() {
        throw zhipuError;
      },
    };
    const deepseek: ReviewProvider = {
      name: "deepseek",
      async generate() {
        return [
          { id: "a", styleId: "daily", styleName: "", styleLabel: "", content: "DeepSeek日常评价".repeat(20) },
          { id: "b", styleId: "friend", styleName: "", styleLabel: "", content: "DeepSeek朋友评价".repeat(20) },
          { id: "c", styleId: "local", styleName: "", styleLabel: "", content: "DeepSeek本地评价".repeat(20) },
        ];
      },
    };
    const failures: string[] = [];
    const generator = new ReviewGenerator({
      providers: new Map([[zhipu.name, zhipu], [deepseek.name, deepseek]]),
      fallback: new LocalFallbackProvider(),
      failoverProviders: new Map([["zhipu", "deepseek"]]),
      onProviderFailure: ({ provider }) => failures.push(provider),
    });

    const result = await generator.generate(context, "zhipu");

    assert.equal(result.length, 3);
    assert.ok(result.every((item) => item.provider === "deepseek"));
    assert.deepEqual(failures, ["zhipu"]);
  }
});

test("ReviewGenerator uses local fallback when DeepSeek failover is also unusable", async () => {
  const zhipu: ReviewProvider = {
    name: "zhipu",
    async generate() {
      throw new Error("Zhipu request failed: 500");
    },
  };
  const deepseek: ReviewProvider = {
    name: "deepseek",
    async generate() {
      return ["甲", "乙", "丙"].map((marker, index) => ({
        id: marker,
        styleId: ["daily", "friend", "local"][index],
        styleName: "",
        styleLabel: "",
        content: marker.repeat(99),
      }));
    },
  };
  const generator = new ReviewGenerator({
    providers: new Map([[zhipu.name, zhipu], [deepseek.name, deepseek]]),
    fallback: new LocalFallbackProvider(),
    failoverProviders: new Map([["zhipu", "deepseek"]]),
  });

  const result = await generator.generate(context, "zhipu");

  assert.equal(result.length, 3);
  assert.ok(result.every((item) => item.provider === "local-template"));
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

test("ReviewGenerator falls back when any remote review is shorter than 100 characters", async () => {
  const remote: ReviewProvider = {
    name: "deepseek",
    async generate() {
      return ["甲", "乙", "丙"].map((marker, index) => ({
        id: marker,
        styleId: ["daily", "friend", "local"][index],
        styleName: "",
        styleLabel: "",
        content: marker.repeat(99),
      }));
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
test("ReviewGenerator fails over from SiliconFlow to DeepSeek when SiliconFlow throws", async () => {
  let siliconflowCalls = 0;
  let deepseekCalls = 0;

  const siliconflow: ReviewProvider = {
    name: "siliconflow",

    async generate() {
      siliconflowCalls += 1;

      throw new Error(
        "SiliconFlow request failed: 429",
      );
    },
  };

  const deepseek: ReviewProvider = {
    name: "deepseek",

    async generate() {
      deepseekCalls += 1;

      return [
        {
          id: "a",
          styleId: "daily",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek日常评价".repeat(20),
        },
        {
          id: "b",
          styleId: "friend",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek朋友评价".repeat(20),
        },
        {
          id: "c",
          styleId: "local",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek本地评价".repeat(20),
        },
      ];
    },
  };

  const failures: string[] = [];

  const generator = new ReviewGenerator({
    providers: new Map([
      ["siliconflow", siliconflow],
      ["deepseek", deepseek],
    ]),

    fallback: new LocalFallbackProvider(),

    failoverProviders: new Map([
      ["siliconflow", "deepseek"],
    ]),

    onProviderFailure: ({ provider }) => {
      failures.push(provider);
    },
  });

  const result = await generator.generate(
    context,
    "siliconflow",
  );

  assert.equal(siliconflowCalls, 1);
  assert.equal(deepseekCalls, 1);

  assert.equal(result.length, 3);

  assert.ok(
    result.every(
      (item) => item.provider === "deepseek",
    ),
  );

  assert.deepEqual(
    failures,
    ["siliconflow"],
  );
});
test("ReviewGenerator fails over to DeepSeek when SiliconFlow returns reviews shorter than 100 characters", async () => {
  let deepseekCalls = 0;

  const siliconflow: ReviewProvider = {
    name: "siliconflow",

    async generate() {
      return [
        {
          id: "a",
          styleId: "daily",
          styleName: "",
          styleLabel: "",
          content: "甲".repeat(99),
        },
        {
          id: "b",
          styleId: "friend",
          styleName: "",
          styleLabel: "",
          content: "乙".repeat(99),
        },
        {
          id: "c",
          styleId: "local",
          styleName: "",
          styleLabel: "",
          content: "丙".repeat(99),
        },
      ];
    },
  };

  const deepseek: ReviewProvider = {
    name: "deepseek",

    async generate() {
      deepseekCalls += 1;

      return [
        {
          id: "a",
          styleId: "daily",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek日常评价".repeat(20),
        },
        {
          id: "b",
          styleId: "friend",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek朋友评价".repeat(20),
        },
        {
          id: "c",
          styleId: "local",
          styleName: "",
          styleLabel: "",
          content: "DeepSeek本地评价".repeat(20),
        },
      ];
    },
  };

  const failures: string[] = [];

  const generator = new ReviewGenerator({
    providers: new Map([
      ["siliconflow", siliconflow],
      ["deepseek", deepseek],
    ]),

    fallback: new LocalFallbackProvider(),

    failoverProviders: new Map([
      ["siliconflow", "deepseek"],
    ]),

    onProviderFailure: ({ provider }) => {
      failures.push(provider);
    },
  });

  const result = await generator.generate(
    context,
    "siliconflow",
  );

  assert.equal(deepseekCalls, 1);

  assert.ok(
    result.every(
      (item) => item.provider === "deepseek",
    ),
  );

  assert.deepEqual(
    failures,
    ["siliconflow"],
  );
});