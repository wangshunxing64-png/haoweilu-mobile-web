import assert from "node:assert/strict";
import test from "node:test";

import { ZhipuProvider } from "../../src/ai/providers/zhipu.provider.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

const context = {
  merchant: lijiMerchantSeed,
  input: {
    dishIds: ["bone-soup"],
    tagIds: ["broth"],
    dishes: ["骨汤烫菜"],
    tags: ["汤底鲜香"],
    message: "汤底很香。",
  },
};

function successfulResponse() {
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({ reviews: [
      { styleId: "daily", content: "自然真实的第一条" },
      { styleId: "friend", content: "自然真实的第二条" },
      { styleId: "local", content: "自然真实的第三条" },
    ] }) } }],
  }), { status: 200, headers: { "content-type": "application/json" } });
}

test("ZhipuProvider calls the official GLM-4.7-Flash endpoint and parses three reviews", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;
  const provider = new ZhipuProvider({
    apiKey: "test-secret",
    fetchImpl: async (input, init) => {
      receivedUrl = String(input);
      receivedInit = init;
      return successfulResponse();
    },
  });

  const reviews = await provider.generate(context);

  assert.equal(receivedUrl, "https://open.bigmodel.cn/api/paas/v4/chat/completions");
  assert.equal((receivedInit?.headers as Record<string, string>).Authorization, "Bearer test-secret");
  const requestBody = JSON.parse(String(receivedInit?.body));
  assert.equal(requestBody.model, "glm-4.7-flash");
  assert.deepEqual(requestBody.response_format, { type: "json_object" });
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
  const systemPrompt = requestBody.messages[0].content;
  assert.match(systemPrompt, /每条评价控制在\s*150\s*到\s*220\s*个字符/);
  assert.match(systemPrompt, /菜品.*体验标签.*补充感受/);
  assert.match(systemPrompt, /日常分享型.*朋友推荐型.*本地体验型/);
  assert.match(systemPrompt, /避免.*重复.*空话.*机器表达/);
  assert.equal(reviews.length, 3);
  assert.ok(reviews.every((review) => review.provider === "zhipu"));
});

test("ZhipuProvider retries a rate-limited request before returning reviews", async () => {
  let calls = 0;
  const provider = new ZhipuProvider({
    apiKey: "test-secret",
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response("rate limited", { status: 429, headers: { "retry-after": "0" } });
      return successfulResponse();
    },
  });

  const reviews = await provider.generate(context);

  assert.equal(calls, 2);
  assert.equal(reviews.length, 3);
  assert.ok(reviews.every((review) => review.provider === "zhipu"));
});

test("ZhipuProvider stops after two rate-limited attempts so DeepSeek can take over", async () => {
  let calls = 0;
  const provider = new ZhipuProvider({
    apiKey: "test-secret",
    fetchImpl: async () => {
      calls += 1;
      return new Response("rate limited", { status: 429, headers: { "retry-after": "0" } });
    },
  });

  await assert.rejects(() => provider.generate(context), /Zhipu request failed: 429/);
  assert.equal(calls, 2);
});
