import "dotenv/config";

import { Prisma } from "../src/generated/prisma/client.js";
import { createPrismaClient } from "../src/infrastructure/database/prisma.ts";
import { lijiMerchantSeed } from "../src/modules/merchants/liji.seed.ts";

const prisma = createPrismaClient();

async function main(): Promise<void> {
  const merchant = lijiMerchantSeed;
  const defaultProvider = process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER || merchant.ai.provider;
  const defaultModel = defaultProvider === "deepseek"
    ? (process.env.DEEPSEEK_MODEL || "deepseek-v4-flash")
    : merchant.ai.model || null;
  const store = merchant.store;
  if (!store) throw new Error("Li Ji seed requires a default store");

  await prisma.$transaction(async (tx) => {
    await tx.merchant.upsert({
      where: { id: merchant.id },
      create: {
        id: merchant.id,
        name: merchant.name,
        storageKey: merchant.storageKey,
        theme: merchant.theme as Prisma.InputJsonValue,
        copy: merchant.copy as Prisma.InputJsonValue,
        rules: merchant.rules as Prisma.InputJsonValue,
        aiProvider: defaultProvider,
        aiModel: defaultModel,
        aiFallbackToLocal: merchant.ai.fallbackToLocal,
        reviewStyles: merchant.reviewStyles as unknown as Prisma.InputJsonValue,
      },
      update: {
        name: merchant.name,
        storageKey: merchant.storageKey,
        theme: merchant.theme as Prisma.InputJsonValue,
        copy: merchant.copy as Prisma.InputJsonValue,
        rules: merchant.rules as Prisma.InputJsonValue,
        aiProvider: defaultProvider,
        aiModel: defaultModel,
        aiFallbackToLocal: merchant.ai.fallbackToLocal,
        reviewStyles: merchant.reviewStyles as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.store.upsert({
      where: { id: store.id },
      create: {
        id: store.id,
        externalId: store.id,
        merchantId: merchant.id,
        name: store.name,
        active: true,
      },
      update: {
        externalId: store.id,
        name: store.name,
        active: true,
      },
    });

    await tx.dish.deleteMany({ where: { merchantId: merchant.id } });
    await tx.experienceTag.deleteMany({ where: { merchantId: merchant.id } });
    await tx.publishPlatform.deleteMany({ where: { merchantId: merchant.id } });

    await tx.dish.createMany({
      data: merchant.dishes.map((dish, index) => ({
        externalId: dish.id,
        merchantId: merchant.id,
        storeId: store.id,
        name: dish.name,
        description: dish.description,
        sortOrder: index,
        active: true,
      })),
    });

    await tx.experienceTag.createMany({
      data: merchant.tagGroups.flatMap((group, groupIndex) =>
        group.tags.map((tag, tagIndex) => ({
          externalId: tag.id,
          merchantId: merchant.id,
          storeId: store.id,
          groupExternalId: group.id,
          groupName: group.name,
          name: tag.name,
          groupSortOrder: groupIndex,
          sortOrder: tagIndex,
          active: true,
        })),
      ),
    });

    await tx.publishPlatform.createMany({
      data: merchant.platforms.map((platform, index) => ({
        externalId: platform.id,
        merchantId: merchant.id,
        storeId: store.id,
        name: platform.name,
        url: platform.url,
        actionHint: platform.actionHint,
        miniProgram: platform.miniProgram as Prisma.InputJsonValue,
        sortOrder: index,
        active: true,
      })),
    });
  });

  console.log(`Seeded merchant ${merchant.id} (${merchant.name}) with provider ${defaultProvider}`);
}

main()
  .catch((error) => {
    console.error("Database seed failed", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
