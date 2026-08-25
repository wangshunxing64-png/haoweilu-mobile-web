import type { AppStore } from "../../infrastructure/database/store.ts";

export async function cleanupExpiredSessions(store: AppStore, before = new Date()): Promise<number> {
  return store.deleteExpiredSessions(before);
}
