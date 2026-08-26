import assert from "node:assert/strict";
import test from "node:test";

import { SiliconFlowProvider } from "../../src/ai/providers/siliconflow.provider.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

const context = {
  merchant: lijiMerchantSeed,
  input: {
    dishIds: ["bone-soup", "pickled-pork"],
    tagIds: ["broth", "warm-service"],
    dishes: ["骨汤烫菜", "酸菜蹄膀"],
    tags: ["汤底鲜香", "服务热情"],
    message: "朋友推荐来的，汤底很香，酸菜蹄膀也很合口味。",
  },
};

function successfulResponse() {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reviews: [
                {
                  styleId: "daily",
                  content: "自然生活化的日常评价".repeat(20),
                },
                {
                  styleId: "friend",
                  content: "适合分享给朋友的推荐评价".repeat(20),
                },
                {
                  styleId: "local",
                  content: "朴实自然的本地体验评价".repeat(20),
                },
              ],
            }),
          },
        },
      ],
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

test("SiliconFlowProvider calls Qwen3-8B with thinking disabled and shared review prompt", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;

  const provider = new SiliconFlowProvider({
    apiKey: "test-secret",
    fetchImpl: async (input, init) => {
      receivedUrl = String(input);
      receivedInit = init;

      return successfulResponse();
    },
  });

  const reviews = await provider.generate(context);

  assert.equal(
    receivedUrl,
    "https://api.siliconflow.cn/v1/chat/completions",
  );

  assert.equal(
    (receivedInit?.headers as Record<string, string>).Authorization,
    "Bearer test-secret",
  );

  const requestBody = JSON.parse(String(receivedInit?.body));

  assert.equal(requestBody.model, "Qwen/Qwen3-8B");

  assert.equal(
    requestBody.enable_thinking,
    false,
  );

  assert.deepEqual(
    requestBody.response_format,
    { type: "json_object" },
  );

  const systemPrompt = requestBody.messages[0].content;

  assert.match(
    systemPrompt,
    /鼓励.*自然.*合理.*生活化.*扩写/,
  );

  assert.match(
    systemPrompt,
    /用餐氛围.*整体感受.*聚餐场景.*回购意愿/,
  );

  assert.match(
    systemPrompt,
    /服务.*环境.*性价比.*主观判断/,
  );

  assert.match(
    systemPrompt,
    /不得少于\s*150\s*个字符/,
  );

  assert.match(
    systemPrompt,
    /真人感.*可编辑空间/,
  );

  assert.equal(reviews.length, 3);

  assert.ok(
    reviews.every((review) => review.provider === "siliconflow"),
  );
});

test("SiliconFlowProvider retries once after the first 429 and succeeds on the second request", async () => {
  let calls = 0;

  const provider = new SiliconFlowProvider({
    apiKey: "test-secret",
    fetchImpl: async () => {
      calls += 1;

      if (calls === 1) {
        return new Response(
          "rate limited",
          {
            status: 429,
            headers: {
              "retry-after": "0",
            },
          },
        );
      }

      return successfulResponse();
    },
  });

  const reviews = await provider.generate(context);

  assert.equal(calls, 2);
  assert.equal(reviews.length, 3);

  assert.ok(
    reviews.every((review) => review.provider === "siliconflow"),
  );
});

test("SiliconFlowProvider stops after two consecutive 429 responses so DeepSeek can take over", async () => {
  let calls = 0;

  const provider = new SiliconFlowProvider({
    apiKey: "test-secret",
    fetchImpl: async () => {
      calls += 1;

      return new Response(
        "rate limited",
        {
          status: 429,
          headers: {
            "retry-after": "0",
          },
        },
      );
    },
  });

  await assert.rejects(
    () => provider.generate(context),
    /SiliconFlow request failed: 429/,
  );

  // 首次请求 + 1 次重试。
  // 不允许出现第 3 次 Qwen 请求。
  assert.equal(calls, 2);
});