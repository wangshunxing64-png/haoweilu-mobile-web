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
  failoverProviders?: Map<string, string>;
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
  private readonly failoverProviders: Map<string, string>;
  private readonly onProviderFailure?: (event: ProviderFailureEvent) => void;

  constructor(options: ReviewGeneratorOptions) {
    this.providers = options.providers;
    this.fallback = options.fallback;
    this.failoverProviders = options.failoverProviders ?? new Map();
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
      const failoverName = this.failoverProviders.get(provider.name);
      const failover = failoverName && failoverName !== provider.name
        ? this.providers.get(failoverName)
        : undefined;

      if (failover && failover.name !== this.fallback.name) {
        try {
          const reviews = normalizeReviews(
            await failover.generate(context),
            context,
            failover.name,
          );
          if (isUsableResult(reviews)) {
            return reviews;
          }
        } catch (failoverError) {
          this.onProviderFailure?.({ provider: failover.name, error: failoverError });
        }
      }

      return this.fallback.generate(context);
    }
  }
}
