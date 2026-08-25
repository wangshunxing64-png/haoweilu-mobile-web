import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import type {
  AnalyticsEventRecord,
  AnalyticsFilter,
  TrackEventInput,
} from "./analytics.types.ts";

const SENSITIVE_KEYS = new Set([
  "message",
  "content",
  "text",
  "apikey",
  "api_key",
  "authorization",
  "token",
  "secret",
  "password",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    result[key] = sanitizeValue(child);
  }
  return result;
}

export function sanitizeAnalyticsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(payload) as Record<string, unknown>;
}

export class AnalyticsService {
  private readonly store: AppStore;

  constructor(store: AppStore) {
    this.store = store;
  }

  async track(input: TrackEventInput): Promise<AnalyticsEventRecord> {
    let resolvedStoreId = input.storeId;
    if (input.sessionId) {
      const session = await this.store.getSession(input.sessionId);
      if (!session) {
        throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
      }
      if (session.expiresAt.getTime() <= Date.now()) {
        throw new AppError("SESSION_EXPIRED", "评价会话已过期，请重新扫码开始", 410);
      }
      if (session.merchantId !== input.merchantId) {
        throw new AppError("SESSION_MERCHANT_MISMATCH", "埋点会话不属于当前商户", 409);
      }
      if (input.storeId && session.storeId && input.storeId !== session.storeId) {
        throw new AppError("SESSION_STORE_MISMATCH", "埋点会话不属于当前门店", 409);
      }
      resolvedStoreId = input.storeId ?? session.storeId ?? undefined;
    }

    const merchant = await this.store.getMerchant(input.merchantId, resolvedStoreId);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }

    return this.store.addAnalyticsEvent({
      ...input,
      ...(resolvedStoreId ? { storeId: resolvedStoreId } : {}),
      payload: sanitizeAnalyticsPayload(input.payload ?? {}),
    });
  }

  async funnel(filter: AnalyticsFilter): Promise<{
    scanOpen: number;
    flowStart: number;
    reviewGenerated: number;
    reviewSelected: number;
    platformClicked: number;
    rewardClaimed: number;
  }> {
    const events = await this.store.listAnalyticsEvents(filter);
    const count = (name: string) => events.filter((event) => event.name === name).length;
    return {
      scanOpen: count("scan_open"),
      flowStart: count("flow_start"),
      reviewGenerated: count("review_generated"),
      reviewSelected: count("review_selected"),
      platformClicked: count("platform_clicked"),
      rewardClaimed: count("reward_claimed"),
    };
  }
  async summary(filter: AnalyticsFilter): Promise<{
    funnel: Awaited<ReturnType<AnalyticsService["funnel"]>>;
    aiGenerateCount: number;
    platformClicks: Record<string, number>;
  }> {
    const events = await this.store.listAnalyticsEvents(filter);
    const platformClicks: Record<string, number> = {};
    for (const event of events) {
      if (event.name !== "platform_clicked") continue;
      const platformId = typeof event.payload.platformId === "string" ? event.payload.platformId : "unknown";
      platformClicks[platformId] = (platformClicks[platformId] ?? 0) + 1;
    }
    return {
      funnel: await this.funnel(filter),
      aiGenerateCount: events.filter((event) => event.name === "review_generated").length,
      platformClicks,
    };
  }

}
