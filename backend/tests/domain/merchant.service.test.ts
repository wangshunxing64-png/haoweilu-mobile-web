import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../src/common/errors/app-error.ts";
import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";
import { MerchantService } from "../../src/modules/merchants/merchant.service.ts";

test("MerchantService returns source-compatible Li Ji config without secrets", async () => {
  const service = new MerchantService(new InMemoryStore([lijiMerchantSeed]), "https://api.example.com");
  const merchant = await service.get("liji", "liji-main");

  assert.equal(merchant.id, "liji");
  assert.equal(merchant.name, "李记好味道");
  assert.equal(merchant.dishes.length, 6);
  assert.equal(merchant.tagGroups.length, 3);
  assert.equal(merchant.reviewStyles.length, 3);
  assert.equal(merchant.platforms.length, 2);
  assert.equal(merchant.ai.endpoint, "https://api.example.com/api/reviews/generate");
  assert.equal("apiKey" in merchant.ai, false);
});

test("MerchantService hides missing merchant internals behind a business error", async () => {
  const service = new MerchantService(new InMemoryStore([lijiMerchantSeed]), "");
  await assert.rejects(
    () => service.get("missing"),
    (error: unknown) => error instanceof AppError && error.code === "MERCHANT_NOT_FOUND" && error.statusCode === 404,
  );
});
