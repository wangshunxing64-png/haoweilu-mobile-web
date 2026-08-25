import assert from "node:assert/strict";
import test from "node:test";

import { generateReview } from "../../src/ai/generateReview.ts";
import type { ReviewGenerationContext } from "../../src/ai/provider.ts";

test("generateReview returns a stable three-review response through the generator boundary", async () => {
  const context = {} as ReviewGenerationContext;
  const generator = {
    generate: async () => [
      { id: "review-1", content: "评价一", styleId: "daily", styleName: "日常", styleLabel: "真实" },
      { id: "review-2", content: "评价二", styleId: "friend", styleName: "朋友", styleLabel: "推荐" },
      { id: "review-3", content: "评价三", styleId: "local", styleName: "本地", styleLabel: "体验" },
    ],
  };

  const result = await generateReview(generator, context, "deepseek");

  assert.deepEqual(result, {
    reviews: [
      { content: "评价一", style: "daily" },
      { content: "评价二", style: "friend" },
      { content: "评价三", style: "local" },
    ],
  });
});
