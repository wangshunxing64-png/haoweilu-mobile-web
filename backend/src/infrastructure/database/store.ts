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

export interface AppStore {
  healthCheck(): Promise<void>;

  getMerchant(merchantId: string, storeId?: string): Promise<MerchantConfig | null>;
  getDishesByIds(ids: string[]): Promise<Array<{ id: string; name: string; description: string }>>;
  getExperienceTagsByIds(ids: string[]): Promise<Array<{ id: string; name: string }>>;

  createSession(input: CreateSessionInput): Promise<ReviewSessionRecord>;
  getSession(id: string): Promise<ReviewSessionRecord | null>;
  updateSession(id: string, patch: UpdateSessionInput): Promise<ReviewSessionRecord | null>;

  replaceReviews(sessionId: string, reviews: GeneratedReview[]): Promise<ReviewRecord[]>;
  getReview(id: string): Promise<ReviewRecord | null>;
  listReviews(sessionId: string): Promise<ReviewRecord[]>;
  selectReview(id: string): Promise<ReviewRecord | null>;
  updateReviewContent(id: string, content: string): Promise<ReviewRecord | null>;

  preparePublish(sessionId: string, platformExternalId: string): Promise<PublishRecord>;
  getPublishBySession(sessionId: string): Promise<PublishRecord | null>;
  completePublish(sessionId: string): Promise<PublishRecord | null>;

  getRewardBySession(sessionId: string): Promise<RewardRecord | null>;
  createRewardIfAbsent(input: {
    sessionId: string;
    rewardType: string;
    code: string;
  }): Promise<RewardRecord>;

  addAnalyticsEvent(input: TrackEventInput & { payload: Record<string, unknown> }): Promise<AnalyticsEventRecord>;
  listAnalyticsEvents(filter: AnalyticsFilter): Promise<AnalyticsEventRecord[]>;
  deleteExpiredSessions(before: Date): Promise<number>;
}
