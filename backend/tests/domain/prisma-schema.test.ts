import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

test("Prisma schema contains every backend checklist model and reward idempotency constraints", async () => {
  const schema = await readFile(schemaPath, "utf8");
  for (const model of [
    "Merchant",
    "Store",
    "Dish",
    "ExperienceTag",
    "PublishPlatform",
    "ReviewSession",
    "Review",
    "PublishRecord",
    "RewardRecord",
    "AnalyticsEvent",
  ]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`));
  }

  assert.match(schema, /sessionId\s+String\s+@unique/);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /@@unique\(\[merchantId, externalId\]\)/);
});

test("store-scoped merchant configuration can reuse the same external ids across different stores", async () => {
  const schema = await readFile(schemaPath, "utf8");
  const scopedUniqueCount = (schema.match(/@@unique\(\[merchantId, storeId, externalId\]\)/g) ?? []).length;
  assert.equal(scopedUniqueCount, 3);
});
