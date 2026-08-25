export type ReviewSessionStatus =
  | "CREATED"
  | "INTERVIEWING"
  | "GENERATING"
  | "GENERATED"
  | "SELECTED"
  | "PUBLISH_PREPARED"
  | "PUBLISH_CONFIRMED"
  | "REWARDED";

export interface ReviewSessionRecord {
  id: string;
  merchantId: string;
  storeId: string | null;
  dishIds: string[];
  tagIds: string[];
  message: string;
  selectedReviewId: string;
  selectedPlatformId: string;
  status: ReviewSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CreateSessionInput {
  merchantId: string;
  storeId?: string;
}

export interface UpdateSessionInput {
  dishIds?: string[];
  tagIds?: string[];
  message?: string;
  selectedReviewId?: string;
  selectedPlatformId?: string;
  status?: ReviewSessionStatus;
}
