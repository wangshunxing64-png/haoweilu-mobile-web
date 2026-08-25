import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import type {
  CreateSessionInput,
  ReviewSessionRecord,
  UpdateSessionInput,
} from "./session.types.ts";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export class SessionService {
  private readonly store: AppStore;

  constructor(store: AppStore) {
    this.store = store;
  }

  async create(input: CreateSessionInput): Promise<ReviewSessionRecord> {
    const merchant = await this.store.getMerchant(input.merchantId, input.storeId);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }
    return this.store.createSession({
      merchantId: input.merchantId,
      storeId: merchant.store?.id ?? input.storeId,
    });
  }

  async get(id: string): Promise<ReviewSessionRecord> {
    const session = await this.store.getSession(id);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("SESSION_EXPIRED", "评价会话已过期，请重新扫码开始", 410);
    }
    return session;
  }

  async update(id: string, patch: UpdateSessionInput): Promise<ReviewSessionRecord> {
    const session = await this.get(id);
    const merchant = await this.store.getMerchant(session.merchantId, session.storeId ?? undefined);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }

    const editingInterview = patch.dishIds !== undefined || patch.tagIds !== undefined || patch.message !== undefined;
    if (editingInterview && ["PUBLISH_PREPARED", "PUBLISH_CONFIRMED", "REWARDED"].includes(session.status)) {
      throw new AppError("SESSION_LOCKED", "该会话已进入发布或领奖阶段，不能修改体验内容", 409);
    }

    const next: UpdateSessionInput = { ...patch };

    if (patch.dishIds) {
      const dishIds = unique(patch.dishIds);
      if (dishIds.length > merchant.rules.maxDishSelection) {
        throw new AppError(
          "DISH_SELECTION_LIMIT_EXCEEDED",
          `最多选择 ${merchant.rules.maxDishSelection} 道菜`,
          400,
        );
      }
      const validDishIds = new Set(merchant.dishes.map((dish) => dish.id));
      if (dishIds.some((dishId) => !validDishIds.has(dishId))) {
        throw new AppError("INVALID_DISH_SELECTION", "包含不属于当前商户的菜品", 400);
      }
      next.dishIds = dishIds;
    }

    if (patch.tagIds) {
      const tagIds = unique(patch.tagIds);
      const validTagIds = new Set(
        merchant.tagGroups.flatMap((group) => group.tags.map((tag) => tag.id)),
      );
      if (tagIds.some((tagId) => !validTagIds.has(tagId))) {
        throw new AppError("INVALID_TAG_SELECTION", "包含不属于当前商户的体验标签", 400);
      }
      next.tagIds = tagIds;
    }

    if (patch.message !== undefined) {
      const message = patch.message.trim();
      if (message.length > merchant.rules.maxMessageLength) {
        throw new AppError(
          "MESSAGE_TOO_LONG",
          `补充内容不能超过 ${merchant.rules.maxMessageLength} 个字符`,
          400,
        );
      }
      next.message = message;
    }

    if (!patch.status && (patch.dishIds || patch.tagIds || patch.message !== undefined)) {
      next.status = "INTERVIEWING";
    }

    const updated = await this.store.updateSession(id, next);
    if (!updated) {
      throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
    }
    return updated;
  }
}
