import { reviewApi } from "./api";
const SENSITIVE = new Set(["content", "message", "reviewText", "copyText"]);
export function sanitizePayload(payload: Record<string, unknown> = {}) { return Object.fromEntries(Object.entries(payload).filter(([key]) => !SENSITIVE.has(key))); }
export function track(context: { merchantId: string; storeId?: string; sessionId?: string }, name: string, payload: Record<string, unknown> = {}) { void reviewApi.track({ ...context, name, payload: sanitizePayload(payload) }).catch(() => undefined); }
