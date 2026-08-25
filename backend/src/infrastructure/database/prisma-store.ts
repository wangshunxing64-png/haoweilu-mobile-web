import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type { GeneratedReview } from "../../ai/types.ts";
import type { AnalyticsEventRecord, AnalyticsFilter, TrackEventInput } from "../../modules/analytics/analytics.types.ts";
import type { MerchantConfig, TagGroupConfig } from "../../modules/merchants/merchant.types.ts";
import type { PublishRecord } from "../../modules/publish/publish.types.ts";
import type { RewardRecord } from "../../modules/rewards/reward.types.ts";
import type { ReviewRecord } from "../../modules/reviews/review.types.ts";
import type {
  CreateSessionInput,
  ReviewSessionRecord,
  UpdateSessionInput,
} from "../../modules/sessions/session.types.ts";
import type { AppStore } from "./store.ts";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toSession(row: {
  id: string;
  merchantId: string;
  storeId: string | null;
  dishIds: unknown;
  tagIds: unknown;
  message: string;
  selectedReviewId: string | null;
  selectedPlatformId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}): ReviewSessionRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    storeId: row.storeId,
    dishIds: toStringArray(row.dishIds),
    tagIds: toStringArray(row.tagIds),
    message: row.message,
    selectedReviewId: row.selectedReviewId ?? "",
    selectedPlatformId: row.selectedPlatformId ?? "",
    status: row.status as ReviewSessionRecord["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}

function toReview(row: {
  id: string;
  sessionId: string;
  styleId: string;
  styleName: string;
  styleLabel: string;
  content: string;
  provider: string;
  model: string | null;
  selected: boolean;
  createdAt: Date;
}): ReviewRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    styleId: row.styleId,
    styleName: row.styleName,
    styleLabel: row.styleLabel,
    content: row.content,
    provider: row.provider,
    model: row.model ?? undefined,
    selected: row.selected,
    createdAt: row.createdAt,
  };
}

function toPublish(row: {
  id: string;
  sessionId: string;
  platformExternalId: string;
  preparedAt: Date;
  openedAt: Date | null;
  completedAt: Date | null;
  userConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PublishRecord {
  return { ...row };
}

function toReward(row: {
  id: string;
  sessionId: string;
  rewardType: string;
  code: string;
  status: string;
  claimedAt: Date;
  redeemedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RewardRecord {
  return {
    ...row,
    status: row.status as RewardRecord["status"],
  };
}

export class PrismaStore implements AppStore {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async healthCheck(): Promise<void> {
    await this.prisma.$queryRawUnsafe("SELECT 1");
  }

  async getMerchant(merchantId: string, storeId?: string): Promise<MerchantConfig | null> {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return null;

    const store = storeId
      ? await this.prisma.store.findFirst({
          where: { merchantId, active: true, OR: [{ id: storeId }, { externalId: storeId }] },
        })
      : await this.prisma.store.findFirst({ where: { merchantId, active: true }, orderBy: { createdAt: "asc" } });
    if (storeId && !store) return null;

    const scope = store ? [{ storeId: null }, { storeId: store.id }] : [{ storeId: null }];
    const [dishes, tags, platforms] = await Promise.all([
      this.prisma.dish.findMany({
        where: { merchantId, active: true, OR: scope },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      this.prisma.experienceTag.findMany({
        where: { merchantId, active: true, OR: scope },
        orderBy: [{ groupSortOrder: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      this.prisma.publishPlatform.findMany({
        where: { merchantId, active: true, OR: scope },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const groupMap = new Map<string, TagGroupConfig>();
    for (const tag of tags) {
      const group = groupMap.get(tag.groupExternalId) ?? {
        id: tag.groupExternalId,
        name: tag.groupName,
        tags: [],
      };
      group.tags.push({ id: tag.externalId, name: tag.name });
      groupMap.set(tag.groupExternalId, group);
    }

    return {
      id: merchant.id,
      name: merchant.name,
      storageKey: merchant.storageKey,
      theme: merchant.theme as Record<string, string>,
      copy: merchant.copy as Record<string, unknown>,
      rules: merchant.rules as MerchantConfig["rules"],
      ai: {
        provider: merchant.aiProvider,
        endpoint: "",
        model: merchant.aiModel ?? "",
        fallbackToLocal: merchant.aiFallbackToLocal,
      },
      dishes: dishes.map((dish) => ({
        id: dish.externalId,
        name: dish.name,
        description: dish.description,
      })),
      tagGroups: [...groupMap.values()],
      reviewStyles: merchant.reviewStyles as unknown as MerchantConfig["reviewStyles"],
      platforms: platforms.map((platform) => ({
        id: platform.externalId,
        name: platform.name,
        url: platform.url,
        actionHint: platform.actionHint,
        miniProgram: platform.miniProgram as MerchantConfig["platforms"][number]["miniProgram"],
      })),
      store: store ? { id: store.id, name: store.name } : undefined,
    };
  }

  async getDishesByIds(ids: string[]): Promise<Array<{ id: string; name: string; description: string }>> {
    if (!ids.length) return [];
    const rows = await this.prisma.dish.findMany({
      where: { externalId: { in: ids }, active: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((dish) => ({ id: dish.externalId, name: dish.name, description: dish.description }));
  }

  async getExperienceTagsByIds(ids: string[]): Promise<Array<{ id: string; name: string }>> {
    if (!ids.length) return [];
    const rows = await this.prisma.experienceTag.findMany({
      where: { externalId: { in: ids }, active: true },
      orderBy: [{ groupSortOrder: "asc" }, { sortOrder: "asc" }],
    });
    return rows.map((tag) => ({ id: tag.externalId, name: tag.name }));
  }

  async createSession(input: CreateSessionInput): Promise<ReviewSessionRecord> {
    const row = await this.prisma.reviewSession.create({
      data: {
        merchantId: input.merchantId,
        storeId: input.storeId ?? null,
        dishIds: [],
        tagIds: [],
        message: "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return toSession(row);
  }

  async getSession(id: string): Promise<ReviewSessionRecord | null> {
    const row = await this.prisma.reviewSession.findUnique({ where: { id } });
    return row ? toSession(row) : null;
  }

  async updateSession(id: string, patch: UpdateSessionInput): Promise<ReviewSessionRecord | null> {
    const exists = await this.prisma.reviewSession.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const row = await this.prisma.reviewSession.update({
      where: { id },
      data: {
        ...(patch.dishIds !== undefined ? { dishIds: patch.dishIds } : {}),
        ...(patch.tagIds !== undefined ? { tagIds: patch.tagIds } : {}),
        ...(patch.message !== undefined ? { message: patch.message } : {}),
        ...(patch.selectedReviewId !== undefined
          ? { selectedReviewId: patch.selectedReviewId || null }
          : {}),
        ...(patch.selectedPlatformId !== undefined
          ? { selectedPlatformId: patch.selectedPlatformId || null }
          : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
      },
    });
    return toSession(row);
  }

  async replaceReviews(sessionId: string, reviews: GeneratedReview[]): Promise<ReviewRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { sessionId } });
      const created: ReviewRecord[] = [];
      for (const review of reviews) {
        const row = await tx.review.create({
          data: {
            sessionId,
            styleId: review.styleId,
            styleName: review.styleName,
            styleLabel: review.styleLabel,
            content: review.content,
            provider: review.provider ?? "unknown",
            model: review.model ?? null,
          },
        });
        created.push(toReview(row));
      }
      return created;
    });
  }

  async getReview(id: string): Promise<ReviewRecord | null> {
    const row = await this.prisma.review.findUnique({ where: { id } });
    return row ? toReview(row) : null;
  }

  async listReviews(sessionId: string): Promise<ReviewRecord[]> {
    const rows = await this.prisma.review.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toReview);
  }

  async selectReview(id: string): Promise<ReviewRecord | null> {
    const target = await this.prisma.review.findUnique({ where: { id } });
    if (!target) return null;
    return this.prisma.$transaction(async (tx) => {
      await tx.review.updateMany({ where: { sessionId: target.sessionId }, data: { selected: false } });
      const row = await tx.review.update({ where: { id }, data: { selected: true } });
      return toReview(row);
    });
  }

  async updateReviewContent(id: string, content: string): Promise<ReviewRecord | null> {
    const exists = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const row = await this.prisma.review.update({ where: { id }, data: { content } });
    return toReview(row);
  }

  async preparePublish(sessionId: string, platformExternalId: string): Promise<PublishRecord> {
    const now = new Date();
    const row = await this.prisma.publishRecord.upsert({
      where: { sessionId },
      create: { sessionId, platformExternalId, preparedAt: now },
      update: {
        platformExternalId,
        preparedAt: now,
        openedAt: null,
        completedAt: null,
        userConfirmed: false,
      },
    });
    return toPublish(row);
  }

  async getPublishBySession(sessionId: string): Promise<PublishRecord | null> {
    const row = await this.prisma.publishRecord.findUnique({ where: { sessionId } });
    return row ? toPublish(row) : null;
  }

  async completePublish(sessionId: string): Promise<PublishRecord | null> {
    const current = await this.prisma.publishRecord.findUnique({ where: { sessionId } });
    if (!current) return null;
    const row = await this.prisma.publishRecord.update({
      where: { sessionId },
      data: { userConfirmed: true, completedAt: new Date() },
    });
    return toPublish(row);
  }

  async getRewardBySession(sessionId: string): Promise<RewardRecord | null> {
    const row = await this.prisma.rewardRecord.findUnique({ where: { sessionId } });
    return row ? toReward(row) : null;
  }

  async createRewardIfAbsent(input: {
    sessionId: string;
    rewardType: string;
    code: string;
  }): Promise<RewardRecord> {
    try {
      const row = await this.prisma.rewardRecord.upsert({
        where: { sessionId: input.sessionId },
        update: {},
        create: {
          sessionId: input.sessionId,
          rewardType: input.rewardType,
          code: input.code,
        },
      });
      return toReward(row);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new Error("REWARD_CODE_CONFLICT");
      }
      throw error;
    }
  }

  async addAnalyticsEvent(
    input: TrackEventInput & { payload: Record<string, unknown> },
  ): Promise<AnalyticsEventRecord> {
    const row = await this.prisma.analyticsEvent.create({
      data: {
        merchantId: input.merchantId,
        storeId: input.storeId ?? null,
        sessionId: input.sessionId ?? null,
        name: input.name,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
    return {
      id: row.id,
      merchantId: row.merchantId,
      storeId: row.storeId,
      sessionId: row.sessionId,
      name: row.name,
      payload: row.payload as Record<string, unknown>,
      createdAt: row.createdAt,
    };
  }

  async listAnalyticsEvents(filter: AnalyticsFilter): Promise<AnalyticsEventRecord[]> {
    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        merchantId: filter.merchantId,
        ...(filter.storeId ? { storeId: filter.storeId } : {}),
        ...(filter.dateFrom || filter.dateTo
          ? {
              createdAt: {
                ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
                ...(filter.dateTo ? { lte: filter.dateTo } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      merchantId: row.merchantId,
      storeId: row.storeId,
      sessionId: row.sessionId,
      name: row.name,
      payload: row.payload as Record<string, unknown>,
      createdAt: row.createdAt,
    }));
  }
  async deleteExpiredSessions(before: Date): Promise<number> {
    const result = await this.prisma.reviewSession.deleteMany({
      where: { expiresAt: { lt: before } },
    });
    return result.count;
  }

}
