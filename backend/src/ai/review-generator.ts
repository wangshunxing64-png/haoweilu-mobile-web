import type {
  GeneratedReview,
  ReviewGenerationContext,
  ReviewProvider,
} from "./types.ts";
import { meetsMinimumReviewLength } from "./review-constraints.ts";

interface ProviderFailureEvent {
  provider: string;
  error: unknown;
}

interface ReviewGeneratorOptions {
  providers: Map<string, ReviewProvider>;
  fallback: ReviewProvider;
  onProviderFailure?: (event: ProviderFailureEvent) => void;
}

function isUsableResult(reviews: GeneratedReview[]): boolean {
  if (reviews.length !== 3) return false;
  if (reviews.some((review) => !meetsMinimumReviewLength(review.content ?? ""))) return false;
  return new Set(reviews.map((review) => review.content.trim())).size === 3;
}

function normalizeReviews(
  reviews: GeneratedReview[],
  context: ReviewGenerationContext,
  providerName: string,
): GeneratedReview[] {
  return reviews.map((review, index) => {
    const style = context.merchant.reviewStyles.find((item) => item.id === review.styleId)
      ?? context.merchant.reviewStyles[index];

    return {
      ...review,
      id: review.id || `review-${style?.id ?? index + 1}`,
      styleId: style?.id ?? review.styleId,
      styleName: style?.name ?? review.styleName,
      styleLabel: style?.label ?? review.styleLabel,
      content: review.content.trim(),
      provider: providerName,
    };
  });
}

export class ReviewGenerator {
  private readonly providers: Map<string, ReviewProvider>;
  private readonly fallback: ReviewProvider;
  private readonly onProviderFailure?: (event: ProviderFailureEvent) => void;

  constructor(options: ReviewGeneratorOptions) {
    this.providers = options.providers;
    this.fallback = options.fallback;
    this.onProviderFailure = options.onProviderFailure;
  }

  async generate(
    context: ReviewGenerationContext,
    preferredProvider: string,
  ): Promise<GeneratedReview[]> {
    if (preferredProvider === this.fallback.name || preferredProvider === "local-template") {
      return this.fallback.generate(context);
    }

    const provider = this.providers.get(preferredProvider);
    if (!provider) {
      return this.fallback.generate(context);
    }

    try {
      const reviews = normalizeReviews(await provider.generate(context), context, provider.name);
      if (!isUsableResult(reviews)) {
        return this.fallback.generate(context);
      }
      return reviews;
    } catch (error) {
      this.onProviderFailure?.({ provider: provider.name, error });
      return this.fallback.generate(context);
    }
  }
}
