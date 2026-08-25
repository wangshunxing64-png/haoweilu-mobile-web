import assert from "node:assert/strict";
import test from "node:test";

import { DeepSeekProvider } from "../../src/ai/providers/deepseek.provider.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

const context = {
  merchant: lijiMerchantSeed,
  input: {
    dishIds: ["bone-soup", "pickled-pork"],
    tagIds: ["broth", "warm-service"],
    dishes: ["骨汤烫菜", "酸菜蹄膀"],
    tags: ["汤底鲜香", "服务热情"],
    message: "朋友推荐来的，汤底很香。",
  },
};

test("DeepSeekProvider calls the official chat-completions endpoint and parses structured reviews", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;
  const provider = new DeepSeekProvider({
    apiKey: "test-secret",
    baseUrl: "https://api.deepseek.com",
    fetchImpl: async (input, init) => {
      receivedUrl = String(input);
      receivedInit = init;
      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              reviews: [
                { styleId: "daily", content: "真实自然的第一条" },
                { styleId: "friend", content: "真实自然的第二条" },
                { styleId: "local", content: "真实自然的第三条" },
              ],
            }),
          },
        }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  const reviews = await provider.generate(context);

  assert.equal(receivedUrl, "https://api.deepseek.com/chat/completions");
  assert.equal((receivedInit?.headers as Record<string, string>).Authorization, "Bearer test-secret");
  const requestBody = JSON.parse(String(receivedInit?.body));
  assert.equal(requestBody.model, "deepseek-v4-flash");
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
  assert.deepEqual(requestBody.response_format, { type: "json_object" });
  assert.ok(JSON.stringify(requestBody.messages).includes("朋友推荐来的，汤底很香。"));
  assert.equal(reviews.length, 3);
  assert.deepEqual(reviews.map((review) => review.styleId), ["daily", "friend", "local"]);
});

test("DeepSeekProvider rejects non-success upstream responses", async () => {
  const provider = new DeepSeekProvider({
    apiKey: "test-secret",
    fetchImpl: async () => new Response("rate limited", { status: 429 }),
  });

  await assert.rejects(() => provider.generate(context), /DeepSeek request failed: 429/);
});

test("DeepSeekProvider rejects malformed JSON content so orchestration can fall back", async () => {
  const provider = new DeepSeekProvider({
    apiKey: "test-secret",
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: "not-json" } }],
    }), { status: 200 }),
  });

  await assert.rejects(() => provider.generate(context), /AI返回格式错误/);
});
