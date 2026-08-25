import type { GeneratedReview } from "../../ai/types.ts";

export interface ReviewRecord extends GeneratedReview {
  id: string;
  sessionId: string;
  provider: string;
  model?: string;
  selected: boolean;
  createdAt: Date;
}

export interface GenerateReviewRequest {
  provider: string;
  model: string;
  merchantId: string;
  storeId?: string;
  sessionId?: string;
  input: {
    dishes: string[];
    tags: string[];
    message: string;
  };
}

export interface GenerateReviewResponse {
  sessionId: string;
  reviews: ReviewRecord[];
}
