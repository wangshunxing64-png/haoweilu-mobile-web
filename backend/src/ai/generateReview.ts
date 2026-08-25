import type { ReviewGenerator } from "./review-generator.ts";
import type { ReviewGenerationContext } from "./types.ts";

export interface StableGeneratedReview {
  content: string;
  style: string;
}

export interface GenerateReviewResult {
  reviews: StableGeneratedReview[];
}

export async function generateReview(
  generator: Pick<ReviewGenerator, "generate">,
  context: ReviewGenerationContext,
  provider: string,
): Promise<GenerateReviewResult> {
  const reviews = await generator.generate(context, provider);

  return {
    reviews: reviews.map((review) => ({
      content: review.content,
      style: review.styleId,
    })),
  };
}
