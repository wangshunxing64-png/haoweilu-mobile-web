import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import type { PublishRecord } from "./publish.types.ts";

export interface PreparePublishInput {
  sessionId: string;
  platformId: string;
}

export interface PreparePublishResult {
  publishId: string;
  platformName: string;
  url: string;
  hint: string;
  miniProgram: { appId: string; path: string };
  text: string;
  platform: string;
  action: "open_app";
  scheme: string;
  copyText: string;
}

export class PublishService {
  private readonly store: AppStore;

  constructor(store: AppStore) {
    this.store = store;
  }

  async prepare(input: PreparePublishInput): Promise<PreparePublishResult> {
    const session = await this.store.getSession(input.sessionId);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("SESSION_EXPIRED", "评价会话已过期，请重新扫码开始", 410);
    }
    if (["PUBLISH_CONFIRMED", "REWARDED"].includes(session.status)) {
      throw new AppError("SESSION_LOCKED", "该会话已完成发布或领奖，不能重新准备发布", 409);
    }
    if (!session.selectedReviewId || !["SELECTED", "PUBLISH_PREPARED"].includes(session.status)) {
      throw new AppError("REVIEW_NOT_SELECTED", "请先选择一条评价", 409);
    }

    const merchant = await this.store.getMerchant(session.merchantId, session.storeId ?? undefined);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }
    const platform = merchant.platforms.find((item) => item.id === input.platformId);
    if (!platform) {
      throw new AppError("PLATFORM_NOT_FOUND", "发布平台不存在", 404);
    }
    const review = await this.store.getReview(session.selectedReviewId);
    if (!review || review.sessionId !== session.id) {
      throw new AppError("REVIEW_NOT_FOUND", "已选评价不存在", 404);
    }

    const publish = await this.store.preparePublish(session.id, platform.id);
    await this.store.updateSession(session.id, {
      selectedPlatformId: platform.id,
      status: "PUBLISH_PREPARED",
    });

    const scheme = platform.id === "meituan" ? "imeituan://" : platform.id === "dianping" ? "dianping://" : "";
    return {
      publishId: publish.id,
      platformName: platform.name,
      url: platform.url,
      hint: platform.actionHint,
      miniProgram: platform.miniProgram,
      text: review.content,
      platform: platform.id,
      action: "open_app",
      scheme,
      copyText: review.content,
    };
  }

  async complete(input: { sessionId: string }): Promise<PublishRecord> {
    const session = await this.store.getSession(input.sessionId);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("SESSION_EXPIRED", "评价会话已过期，请重新扫码开始", 410);
    }
    const prepared = await this.store.getPublishBySession(session.id);
    if (!prepared) {
      throw new AppError("PUBLISH_NOT_PREPARED", "尚未准备发布", 409);
    }
    if (["PUBLISH_CONFIRMED", "REWARDED"].includes(session.status) && prepared.userConfirmed) {
      return prepared;
    }
    if (session.status !== "PUBLISH_PREPARED") {
      throw new AppError("PUBLISH_NOT_PREPARED", "当前会话不在待确认发布状态", 409);
    }
    const completed = await this.store.completePublish(session.id);
    if (!completed) {
      throw new AppError("PUBLISH_NOT_PREPARED", "尚未准备发布", 409);
    }
    await this.store.updateSession(session.id, { status: "PUBLISH_CONFIRMED" });
    return completed;
  }
}
