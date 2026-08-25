import { randomInt } from "node:crypto";

import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import type { RewardRecord } from "./reward.types.ts";

const REWARD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRewardCode(length = 6): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += REWARD_ALPHABET[randomInt(0, REWARD_ALPHABET.length)];
  }
  return code;
}

export class RewardService {
  private readonly store: AppStore;
  private readonly codeFactory: () => string;

  constructor(store: AppStore, codeFactory: () => string = generateRewardCode) {
    this.store = store;
    this.codeFactory = codeFactory;
  }

  async claim(sessionId: string): Promise<RewardRecord> {
    const existing = await this.store.getRewardBySession(sessionId);
    if (existing) {
      const current = await this.store.getSession(sessionId);
      if (current && current.status !== "REWARDED") {
        await this.store.updateSession(sessionId, { status: "REWARDED" });
      }
      return existing;
    }

    const session = await this.store.getSession(sessionId);
    if (!session) {
      throw new AppError("SESSION_NOT_FOUND", "评价会话不存在", 404);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("SESSION_EXPIRED", "评价会话已过期，请重新扫码开始", 410);
    }
    const publish = await this.store.getPublishBySession(sessionId);
    if (!publish?.userConfirmed || session.status !== "PUBLISH_CONFIRMED") {
      throw new AppError("PUBLISH_NOT_CONFIRMED", "请先完成真实用餐反馈，再领取感谢礼", 409);
    }

    let reward: RewardRecord | null = null;
    for (let attempt = 0; attempt < 5 && !reward; attempt += 1) {
      try {
        reward = await this.store.createRewardIfAbsent({
          sessionId,
          rewardType: "FREE_DRINK_OR_SIDE",
          code: this.codeFactory(),
        });
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "REWARD_CODE_CONFLICT") {
          throw error;
        }
      }
    }

    if (!reward) {
      throw new AppError("REWARD_CODE_EXHAUSTED", "奖励码生成失败，请稍后重试", 503);
    }

    await this.store.updateSession(sessionId, { status: "REWARDED" });
    return reward;
  }
}
