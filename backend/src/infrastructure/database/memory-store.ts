import { randomUUID } from "node:crypto";

import type { GeneratedReview } from "../../ai/types.ts";
import type { AnalyticsEventRecord, AnalyticsFilter, TrackEventInput } from "../../modules/analytics/analytics.types.ts";
import type { MerchantConfig } from "../../modules/merchants/merchant.types.ts";
import type { PublishRecord } from "../../modules/publish/publish.types.ts";
import type { RewardRecord } from "../../modules/rewards/reward.types.ts";
import type { ReviewRecord } from "../../modules/reviews/review.types.ts";
import type {
  CreateSessionInput,
  ReviewSessionRecord,
  UpdateSessionInput,
} from "../../modules/sessions/session.types.ts";
import type { AppStore } from "./store.ts";

export class InMemoryStore implements AppStore {
  private readonly merchants = new Map<string, MerchantConfig>();
  private readonly sessions = new Map<string, ReviewSessionRecord>();
  private readonly reviews = new Map<string, ReviewRecord>();
  private readonly publishes = new Map<string, PublishRecord>();
  private readonly rewards = new Map<string, RewardRecord>();
  private readonly analyticsEvents: AnalyticsEventRecord[] = [];

  constructor(merchants: MerchantConfig[] = []) {
    for (const merchant of merchants) {
      this.merchants.set(merchant.id, structuredClone(merchant));
    }
  }

  async healthCheck(): Promise<void> {
    return undefined;
  }

  async getMerchant(merchantId: string, storeId?: string): Promise<MerchantConfig | null> {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return null;
    if (storeId && merchant.store?.id !== storeId) return null;
    return structuredClone(merchant);
  }

  async getDishesByIds(ids: string[]): Promise<Array<{ id: string; name: string; description: string }>> {
    const selected = new Set(ids);
    return [...this.merchants.values()]
      .flatMap((merchant) => merchant.dishes)
      .filter((dish) => selected.has(dish.id))
      .map((dish) => ({ id: dish.id, name: dish.name, description: dish.description }));
  }

  async getExperienceTagsByIds(ids: string[]): Promise<Array<{ id: string; name: string }>> {
    const selected = new Set(ids);
    return [...this.merchants.values()]
      .flatMap((merchant) => merchant.tagGroups.flatMap((group) => group.tags))
      .filter((tag) => selected.has(tag.id))
      .map((tag) => ({ id: tag.id, name: tag.name }));
  }

  async createSession(input: CreateSessionInput): Promise<ReviewSessionRecord> {
    const now = new Date();
    const record: ReviewSessionRecord = {
      id: randomUUID(),
      merchantId: input.merchantId,
      storeId: input.storeId ?? null,
      dishIds: [],
      tagIds: [],
      message: "",
      selectedReviewId: "",
      selectedPlatformId: "",
      status: "CREATED",
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    };
    this.sessions.set(record.id, record);
    return structuredClone(record);
  }

  async getSession(id: string): Promise<ReviewSessionRecord | null> {
    const record = this.sessions.get(id);
    return record ? structuredClone(record) : null;
  }

  async updateSession(id: string, patch: UpdateSessionInput): Promise<ReviewSessionRecord | null> {
    const current = this.sessions.get(id);
    if (!current) return null;
    const next: ReviewSessionRecord = {
      ...current,
      ...structuredClone(patch),
      updatedAt: new Date(),
    };
    this.sessions.set(id, next);
    return structuredClone(next);
  }

  async replaceReviews(sessionId: string, generated: GeneratedReview[]): Promise<ReviewRecord[]> {
    for (const [id, review] of this.reviews.entries()) {
      if (review.sessionId === sessionId) this.reviews.delete(id);
    }

    const now = new Date();
    const records = generated.map((review) => {
      const record: ReviewRecord = {
        ...structuredClone(review),
        id: randomUUID(),
        sessionId,
        provider: review.provider ?? "unknown",
        selected: false,
        createdAt: now,
      };
      this.reviews.set(record.id, record);
      return record;
    });
    return structuredClone(records);
  }

  async getReview(id: string): Promise<ReviewRecord | null> {
    const review = this.reviews.get(id);
    return review ? structuredClone(review) : null;
  }

  async listReviews(sessionId: string): Promise<ReviewRecord[]> {
    return structuredClone([...this.reviews.values()].filter((review) => review.sessionId === sessionId));
  }

  async selectReview(id: string): Promise<ReviewRecord | null> {
    const selected = this.reviews.get(id);
    if (!selected) return null;
    for (const [reviewId, review] of this.reviews.entries()) {
      if (review.sessionId === selected.sessionId) {
        this.reviews.set(reviewId, { ...review, selected: reviewId === id });
      }
    }
    return structuredClone(this.reviews.get(id) ?? null);
  }

  async updateReviewContent(id: string, content: string): Promise<ReviewRecord | null> {
    const review = this.reviews.get(id);
    if (!review) return null;
    const next = { ...review, content };
    this.reviews.set(id, next);
    return structuredClone(next);
  }

  async preparePublish(sessionId: string, platformExternalId: string): Promise<PublishRecord> {
    const existing = this.publishes.get(sessionId);
    const now = new Date();
    const record: PublishRecord = existing
      ? {
          ...existing,
          platformExternalId,
          preparedAt: now,
          userConfirmed: false,
          completedAt: null,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          sessionId,
          platformExternalId,
          preparedAt: now,
          openedAt: null,
          completedAt: null,
          userConfirmed: false,
          createdAt: now,
          updatedAt: now,
        };
    this.publishes.set(sessionId, record);
    return structuredClone(record);
  }

  async getPublishBySession(sessionId: string): Promise<PublishRecord | null> {
    const record = this.publishes.get(sessionId);
    return record ? structuredClone(record) : null;
  }

  async completePublish(sessionId: string): Promise<PublishRecord | null> {
    const current = this.publishes.get(sessionId);
    if (!current) return null;
    const now = new Date();
    const next: PublishRecord = {
      ...current,
      userConfirmed: true,
      completedAt: now,
      updatedAt: now,
    };
    this.publishes.set(sessionId, next);
    return structuredClone(next);
  }

  async getRewardBySession(sessionId: string): Promise<RewardRecord | null> {
    const record = this.rewards.get(sessionId);
    return record ? structuredClone(record) : null;
  }

  async createRewardIfAbsent(input: {
    sessionId: string;
    rewardType: string;
    code: string;
  }): Promise<RewardRecord> {
    const existing = this.rewards.get(input.sessionId);
    if (existing) return structuredClone(existing);

    if ([...this.rewards.values()].some((reward) => reward.code === input.code)) {
      throw new Error("REWARD_CODE_CONFLICT");
    }

    const now = new Date();
    const record: RewardRecord = {
      id: randomUUID(),
      sessionId: input.sessionId,
      rewardType: input.rewardType,
      code: input.code,
      status: "CLAIMED",
      claimedAt: now,
      redeemedAt: null,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.rewards.set(input.sessionId, record);
    return structuredClone(record);
  }
  async addAnalyticsEvent(input: TrackEventInput & { payload: Record<string, unknown> }): Promise<AnalyticsEventRecord> {
    const event: AnalyticsEventRecord = {
      id: randomUUID(),
      merchantId: input.merchantId,
      storeId: input.storeId ?? null,
      sessionId: input.sessionId ?? null,
      name: input.name,
      payload: structuredClone(input.payload),
      createdAt: new Date(),
    };
    this.analyticsEvents.push(event);
    return structuredClone(event);
  }

  async listAnalyticsEvents(filter: AnalyticsFilter): Promise<AnalyticsEventRecord[]> {
    return structuredClone(this.analyticsEvents.filter((event) => {
      if (event.merchantId !== filter.merchantId) return false;
      if (filter.storeId && event.storeId !== filter.storeId) return false;
      if (filter.dateFrom && event.createdAt < filter.dateFrom) return false;
      if (filter.dateTo && event.createdAt > filter.dateTo) return false;
      return true;
    }));
  }

  async deleteExpiredSessions(before: Date): Promise<number> {
    const expiredIds = [...this.sessions.values()]
      .filter((session) => session.expiresAt < before)
      .map((session) => session.id);
    const expired = new Set(expiredIds);

    for (const id of expiredIds) this.sessions.delete(id);
    for (const [id, review] of this.reviews.entries()) {
      if (expired.has(review.sessionId)) this.reviews.delete(id);
    }
    for (const sessionId of expiredIds) {
      this.publishes.delete(sessionId);
      this.rewards.delete(sessionId);
    }
    for (let index = 0; index < this.analyticsEvents.length; index += 1) {
      const event = this.analyticsEvents[index];
      if (event?.sessionId && expired.has(event.sessionId)) {
        this.analyticsEvents[index] = { ...event, sessionId: null };
      }
    }
    return expiredIds.length;
  }

}
