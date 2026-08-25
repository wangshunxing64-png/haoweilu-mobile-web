import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryStore } from "../../src/infrastructure/database/memory-store.ts";
import { lijiMerchantSeed } from "../../src/modules/merchants/liji.seed.ts";
import { cleanupExpiredSessions } from "../../src/modules/sessions/session-cleanup.ts";

test("cleanupExpiredSessions removes sessions whose expiry is before the cutoff", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const session = await store.createSession({ merchantId: "liji", storeId: "liji-main" });

  const removed = await cleanupExpiredSessions(store, new Date(session.expiresAt.getTime() + 1));

  assert.equal(removed, 1);
  assert.equal(await store.getSession(session.id), null);
});

test("cleanup keeps analytics history but detaches the expired session reference", async () => {
  const store = new InMemoryStore([lijiMerchantSeed]);
  const session = await store.createSession({ merchantId: "liji", storeId: "liji-main" });
  await store.addAnalyticsEvent({
    merchantId: "liji",
    storeId: "liji-main",
    sessionId: session.id,
    name: "flow_start",
    payload: {},
  });

  await cleanupExpiredSessions(store, new Date(session.expiresAt.getTime() + 1));
  const events = await store.listAnalyticsEvents({ merchantId: "liji" });

  assert.equal(events.length, 1);
  assert.equal(events[0].sessionId, null);
});
