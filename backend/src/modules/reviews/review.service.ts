import type { ReviewGenerator } from "../../ai/review-generator.ts";
import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { SessionService } from "../sessions/session.service.ts";
import type {
  GenerateReviewRequest,
  GenerateReviewResponse,
  ReviewRecord,
} from "./review.types.ts";

export class ReviewService {
  private readonly store: AppStore;
  private readonly generator: ReviewGenerator;
  private readonly sessions: SessionService;

  constructor(store: AppStore, generator: ReviewGenerator) {
    this.store = store;
    this.generator = generator;
    this.sessions = new SessionService(store);
  }

  private async buildReviewInput(dishIds: string[], tagIds: string[]) {
    const [dishes, tags] = await Promise.all([
      this.store.getDishesByIds(dishIds),
      this.store.getExperienceTagsByIds(tagIds),
    ]);
    return {
      dishIds,
      tagIds,
      dishes: dishes.map((item) => item.name),
      tags: tags.map((item) => item.name),
    };
  }

  async generate(request: GenerateReviewRequest): Promise<GenerateReviewResponse> {
    if (!Array.isArray(request.input.dishes) || request.input.dishes.length === 0) {
      throw new AppError("DISH_SELECTION_REQUIRED", "请至少选择一道真实品尝过的菜品", 400);
    }

    let session = request.sessionId
      ? await this.sessions.get(request.sessionId)
      : await this.sessions.create({ merchantId: request.merchantId, storeId: request.storeId });

    if (session.merchantId !== request.merchantId) {
      throw new AppError("SESSION_MERCHANT_MISMATCH", "会话不属于当前商户", 409);
    }
    if (request.storeId && session.storeId) {
      const requestedStore = await this.store.getMerchant(request.merchantId, request.storeId);
      if (!requestedStore) {
        throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
      }
      if (requestedStore.store?.id && requestedStore.store.id !== session.storeId) {
        throw new AppError("SESSION_STORE_MISMATCH", "会话不属于当前门店", 409);
      }
    }
    if (["PUBLISH_PREPARED", "PUBLISH_CONFIRMED", "REWARDED"].includes(session.status)) {
      throw new AppError("SESSION_LOCKED", "该会话已进入发布或领奖阶段，不能重新生成评价", 409);
    }

    session = await this.sessions.update(session.id, {
      dishIds: request.input.dishes,
      tagIds: request.input.tags,
      message: request.input.message,
      status: "GENERATING",
    });

    const merchant = await this.store.getMerchant(session.merchantId, session.storeId ?? undefined);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }

    const reviewInput = await this.buildReviewInput(session.dishIds, session.tagIds);
    const generated = await this.generator.generate(
      {
        merchant,
        input: {
          ...reviewInput,
          message: session.message,
        },
      },
      merchant.ai.provider,
    );

    if (generated.length !== 3) {
      throw new AppError("REVIEW_GENERATION_FAILED", "未能生成 3 条有效评价", 502);
    }

    const reviews = await this.store.replaceReviews(session.id, generated);
    await this.store.updateSession(session.id, {
      status: "GENERATED",
      selectedReviewId: "",
    });

    return { sessionId: session.id, reviews };
  }

  async select(reviewId: string, finalContent?: string): Promise<ReviewRecord> {
    const review = await this.store.getReview(reviewId);
    if (!review) {
      throw new AppError("REVIEW_NOT_FOUND", "评价不存在", 404);
    }
    const session = await this.sessions.get(review.sessionId);
    if (["PUBLISH_PREPARED", "PUBLISH_CONFIRMED", "REWARDED"].includes(session.status)) {
      throw new AppError("SESSION_LOCKED", "该会话已进入发布或领奖阶段，不能重新选择评价", 409);
    }
    if (!["GENERATED", "SELECTED"].includes(session.status)) {
      throw new AppError("REVIEW_NOT_READY", "当前会话尚未完成评价生成", 409);
    }
    let selected = await this.store.selectReview(reviewId);
    if (!selected) {
      throw new AppError("REVIEW_NOT_FOUND", "评价不存在", 404);
    }

    if (finalContent !== undefined) {
      const content = finalContent.trim();
      if (!content) {
        throw new AppError("REVIEW_CONTENT_REQUIRED", "最终评价内容不能为空", 400);
      }
      if (content.length > 1000) {
        throw new AppError("REVIEW_CONTENT_TOO_LONG", "最终评价内容不能超过 1000 个字符", 400);
      }
      const updated = await this.store.updateReviewContent(reviewId, content);
      if (!updated) throw new AppError("REVIEW_NOT_FOUND", "评价不存在", 404);
      selected = updated;
    }

    await this.store.updateSession(review.sessionId, {
      selectedReviewId: reviewId,
      status: "SELECTED",
    });
    return selected;
  }
}
