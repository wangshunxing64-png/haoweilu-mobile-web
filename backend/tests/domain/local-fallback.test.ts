import assert from "node:assert/strict";
import test from "node:test";

import { LocalFallbackProvider } from "../../src/ai/providers/local-fallback.provider.ts";
import type { MerchantConfig } from "../../src/modules/merchants/merchant.types.ts";

const merchant: MerchantConfig = {
  id: "liji",
  name: "李记好味道",
  storageKey: "ai-restaurant-review:liji",

  theme: {},

  ai: {
    provider: "local-template",
    endpoint: "",
    model: "",
    fallbackToLocal: true,
  },

  copy: {},

  rules: {
    maxDishSelection: 5,
    maxMessageLength: 120,
    generationDelayMs: 1600,
  },

  dishes: [
    {
      id: "bone-soup",
      name: "骨汤烫菜",
      description: "鲜香暖胃",
    },
    {
      id: "pickled-pork",
      name: "酸菜蹄膀",
      description: "软糯开胃",
    },
  ],

  tagGroups: [
    {
      id: "taste",
      name: "味道",
      tags: [
        {
          id: "broth",
          name: "汤底鲜香",
        },
      ],
    },
    {
      id: "service",
      name: "服务",
      tags: [
        {
          id: "warm-service",
          name: "服务热情",
        },
      ],
    },
  ],

  reviewStyles: [
    {
      id: "daily",
      name: "日常分享型",
      label: "生动接地气",
      template:
        "今天来{merchantName}吃饭，点了{dishText}。{tagSentence}{messageSentence}整体吃得很舒服，愿意下次再来。",
    },
    {
      id: "friend",
      name: "朋友推荐型",
      label: "自然推荐",
      template:
        "和朋友一起来{merchantName}，这次尝了{dishText}。{tagSentence}{messageSentence}想把这家店推荐给同样喜欢认真吃饭的朋友。",
    },
    {
      id: "local",
      name: "本地体验型",
      label: "简洁真实",
      template:
        "路过{merchantName}试了一次，{dishText}给我留下了印象。{tagSentence}{messageSentence}是会想再来的一顿家常好味道。",
    },
  ],

  platforms: [],
};

test(
  "LocalFallbackProvider returns three natural review drafts without exposing fallback language",
  async () => {
    const provider =
      new LocalFallbackProvider();

    const reviews =
      await provider.generate({
        merchant,

        input: {
          dishIds: [
            "bone-soup",
            "pickled-pork",
          ],

          tagIds: [
            "broth",
            "warm-service",
          ],

          dishes: [
            "骨汤烫菜",
            "酸菜蹄膀",
          ],

          tags: [
            "汤底鲜香",
            "服务热情",
          ],

          message:
            "朋友推荐来的，汤底很香。",
        },
      });

    assert.equal(
      reviews.length,
      3,
    );

    assert.deepEqual(
      reviews.map(
        (review) => review.styleId,
      ),
      [
        "daily",
        "friend",
        "local",
      ],
    );

    assert.equal(
      new Set(
        reviews.map(
          (review) =>
            review.content,
        ),
      ).size,
      3,
    );

    assert.ok(
      reviews.every(
        (review) =>
          review.content.includes(
            "骨汤烫菜、酸菜蹄膀",
          ),
      ),
    );

    assert.ok(
      reviews.every(
        (review) =>
          review.content.includes(
            "汤底鲜香、服务热情",
          ),
      ),
    );

    assert.ok(
      reviews.every(
        (review) =>
          review.content.includes(
            "朋友推荐来的，汤底很香。",
          ),
      ),
    );

    assert.ok(
      reviews.every(
        (review) =>
          Array.from(
            review.content.trim(),
          ).length >= 100,
      ),
    );

    const forbiddenFallbackPhrases = [
      "这里只保留",
      "已经确认的信息",
      "没有加入未提供",
      "实际选择和填写",
      "根据你的选择",
      "作为 AI",
      "本地模板",
      "fallback",
    ];

    for (
      const review
      of reviews
    ) {
      for (
        const phrase
        of forbiddenFallbackPhrases
      ) {
        assert.equal(
          review.content.includes(
            phrase,
          ),
          false,
          `fallback review leaked machine phrase: ${phrase}`,
        );
      }
    }

    assert.ok(
      reviews.every(
        (review) =>
          review.provider
          === "local-template",
      ),
    );
  },
);

test(
  "LocalFallbackProvider remains natural when the user leaves the free-text message empty",
  async () => {
    const provider =
      new LocalFallbackProvider();

    const reviews =
      await provider.generate({
        merchant,

        input: {
          dishIds: [
            "bone-soup",
          ],

          tagIds: [
            "broth",
          ],

          dishes: [
            "骨汤烫菜",
          ],

          tags: [
            "汤底鲜香",
          ],

          message: "",
        },
      });

    assert.equal(
      reviews.length,
      3,
    );

    assert.ok(
      reviews.every(
        (review) =>
          Array.from(
            review.content.trim(),
          ).length >= 100,
      ),
    );

    assert.ok(
      reviews.every(
        (review) =>
          !review.content.includes(
            "没有补充",
          ),
      ),
    );

    assert.ok(
      reviews.every(
        (review) =>
          !review.content.includes(
            "这里只保留",
          ),
      ),
    );
  },
);