import assert from "node:assert/strict";
import test from "node:test";

import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";

test("Li Ji backend seed preserves the current miniapp business configuration", () => {
  assert.equal(lijiMerchantSeed.ai.provider, "zhipu");
  assert.equal(lijiMerchantSeed.ai.model, "glm-4.7-flash");
  assert.equal(lijiMerchantSeed.ai.fallbackToLocal, true);
  const dishCopy = lijiMerchantSeed.copy.dishes as { description: string };
  assert.equal(lijiMerchantSeed.id, "liji");
  assert.equal(lijiMerchantSeed.name, "李记好味道");
  assert.equal(lijiMerchantSeed.rules.maxDishSelection, 6);
  assert.equal(
    dishCopy.description,
    "最多选择 6 道，方便为您定制心里的真实评价。",
  );
  assert.equal(lijiMerchantSeed.rules.maxMessageLength, 120);
  assert.deepEqual(
    lijiMerchantSeed.dishes.map(({ id, name, description }) => ({ id, name, description })),
    [
      { id: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" },
      { id: "pickled-pork", name: "酸菜蹄膀", description: "软糯开胃" },
      { id: "spicy-chicken-hotpot", name: "辣子鸡火锅", description: "香辣过瘾" },
      { id: "bean-hotpot", name: "豆米火锅", description: "浓郁绵密" },
      { id: "mala-tang", name: "麻辣烫", description: "贵阳风味" },
      { id: "intestine-chicken-hotpot", name: "肥肠鸡火锅", description: "软糯鲜香" },
    ],
  );
  assert.deepEqual(
    lijiMerchantSeed.tagGroups.flatMap((group) => group.tags.map((tag) => tag.id)),
    ["tasty", "broth", "rice-friendly", "warm-service", "fast-service", "comfortable", "generous", "value"],
  );
  assert.deepEqual(lijiMerchantSeed.reviewStyles.map((style) => style.id), ["daily", "friend", "local"]);
  assert.deepEqual(lijiMerchantSeed.platforms.map((platform) => platform.id), ["dianping", "meituan"]);
  assert.equal(lijiMerchantSeed.store?.id, "liji-main");
});
