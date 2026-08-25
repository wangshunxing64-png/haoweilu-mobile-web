import assert from "node:assert/strict";
import test from "node:test";

import { getConfig } from "../../src/modules/config/config.service.ts";

test("getConfig returns the public store configuration without rewards", async () => {
  let receivedStoreId = "";
  const prisma = {
    store: {
      findFirst: async ({ where }: { where: { OR: Array<{ id?: string; externalId?: string }> } }) => {
        receivedStoreId = where.OR[0].id ?? "";
        return {
          id: "liji-main",
          externalId: "liji-main",
          name: "李记好味道·总店",
          merchant: { id: "liji", name: "李记好味道" },
          dishes: [{ id: "dish-row-1", externalId: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" }],
          experienceTags: [{ id: "tag-row-1", externalId: "broth", name: "汤底鲜香" }],
          platforms: [{ id: "platform-row-1", externalId: "meituan", name: "美团", url: "https://www.meituan.com/", actionHint: "打开美团", miniProgram: { appId: "", path: "" } }],
        };
      },
    },
  };

  const result = await getConfig(prisma as never);

  assert.equal(receivedStoreId, "liji-main");
  assert.deepEqual(result, {
    merchant: { id: "liji", name: "李记好味道" },
    store: { id: "liji-main", name: "李记好味道·总店" },
    dishes: [{ id: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" }],
    tags: [{ id: "broth", name: "汤底鲜香" }],
    platforms: [{ id: "meituan", name: "美团", url: "https://www.meituan.com/", actionHint: "打开美团" }],
    rewards: [],
  });
});
