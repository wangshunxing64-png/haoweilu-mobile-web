import type { AnalyticsInput, GenerateReviewResult, PreparePublishResult, PublicConfig, PublishRecord, Review, ReviewSession, RewardRecord } from "../types/api";
import { idempotencyKey } from "../utils/idempotency";
import { apiRequest, patch, post } from "./http-client";
export const reviewApi = {
  config: (storeId?: string) => apiRequest<PublicConfig>(`/api/config${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`),
  createSession: (body: { merchantId: string; storeId?: string }) => post<ReviewSession>("/api/sessions", body, idempotencyKey("session")),
  updateSession: (id: string, body: { dishIds?: string[]; tagIds?: string[]; message?: string }) => patch<ReviewSession>(`/api/sessions/${encodeURIComponent(id)}`, body),
  generateReviews: (body: { merchantId: string; storeId?: string; sessionId: string; input: { dishes: string[]; tags: string[]; message: string } }) => post<GenerateReviewResult>("/api/reviews/generate", body, idempotencyKey("generate")),
  selectReview: (id: string, content: string) => post<Review>(`/api/reviews/${encodeURIComponent(id)}/select`, { content }),
  preparePublish: (sessionId: string, platformId: string) => post<PreparePublishResult>("/api/publish/prepare", { sessionId, platformId }, idempotencyKey("prepare")),
  completePublish: (sessionId: string) => post<PublishRecord>("/api/publish/complete", { sessionId }, idempotencyKey("complete")),
  claimReward: (sessionId: string) => post<RewardRecord>("/api/rewards/claim", { sessionId }, idempotencyKey("reward")),
  track: (body: AnalyticsInput) => post("/api/events", body, idempotencyKey("event")),
};
