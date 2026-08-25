import type { PublicConfig, Review, RewardRecord } from "./api";
export type Screen = "home" | "dishes" | "tags" | "message" | "generating" | "reviews" | "platform" | "completion";
export interface EntryParams { storeId?: string; merchantId?: string; scene?: string }
export interface ReviewFlowState { screen: Screen; config?: PublicConfig; sessionId: string; dishIds: string[]; tagIds: string[]; message: string; reviews: Review[]; selectedReviewId: string; selectedContent: string; selectedPlatformId: string; reward?: RewardRecord; loading: boolean; loadError: string; actionError: string }
