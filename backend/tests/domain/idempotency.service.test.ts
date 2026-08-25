import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../src/common/errors/app-error.ts";
import { IdempotencyService } from "../../src/common/idempotency/idempotency.service.ts";

test("IdempotencyService replays the first result and executes a mutation only once", async () => {
  const service = new IdempotencyService();
  let executions = 0;
  const operation = async () => ({ id: ++executions, value: "ok" });

  const first = await service.run("review-generate", "request-12345678", operation);
  const second = await service.run("review-generate", "request-12345678", operation);

  assert.deepEqual(first, { id: 1, value: "ok" });
  assert.deepEqual(second, first);
  assert.equal(executions, 1);
});

test("IdempotencyService rejects malformed keys", async () => {
  const service = new IdempotencyService();
  await assert.rejects(
    () => service.run("session-create", "bad", async () => ({ ok: true })),
    (error: unknown) => error instanceof AppError && error.code === "INVALID_IDEMPOTENCY_KEY",
  );
});

test("IdempotencyService never re-executes a mutation when Redis result persistence fails after execution", async () => {
  let executions = 0;
  let setCalls = 0;
  const fakeRedis = {
    async get() { return null; },
    async set(_key: string, _value: string, ..._args: unknown[]) {
      setCalls += 1;
      if (setCalls === 1) return "OK";
      throw new Error("redis write failed");
    },
    async del() { return 1; },
    async pexpire() { return 1; },
  };
  const service = new IdempotencyService(fakeRedis as never);

  const operation = async () => ({ id: ++executions });
  const first = await service.run("review-generate", "request-redis-123", operation);
  const second = await service.run("review-generate", "request-redis-123", operation);

  assert.deepEqual(first, { id: 1 });
  assert.deepEqual(second, first);
  assert.equal(executions, 1);
});
