import type { PrismaClient } from "../../generated/prisma/client.js";

export async function getConfig(prisma: PrismaClient, storeId?: string) {
  const resolvedStoreId = storeId ?? "liji-main";
  const store = await prisma.store.findFirst({
    where: { active: true, OR: [{ id: resolvedStoreId }, { externalId: resolvedStoreId }] },
    include: {
      merchant: true,
      dishes: true,
      experienceTags: true,
      platforms: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return {
    merchant: {
      id: store.merchant.id,
      name: store.merchant.name,
    },
    store: {
      id: store.externalId,
      name: store.name,
    },
    dishes: store.dishes.map((dish) => ({
      id: dish.externalId,
      name: dish.name,
      description: dish.description,
    })),
    tags: store.experienceTags.map((tag) => ({
      id: tag.externalId,
      name: tag.name,
    })),
    platforms: store.platforms.map((platform) => ({
      id: platform.externalId,
      name: platform.name,
      url: platform.url,
      actionHint: platform.actionHint,
    })),
    rewards: [],
  };
}
