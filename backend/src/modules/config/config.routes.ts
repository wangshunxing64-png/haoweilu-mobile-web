import type { PrismaClient } from "../../generated/prisma/client.js";
import type { FastifyInstance } from "fastify";

import { getConfig } from "./config.service.ts";

export async function registerConfigRoutes(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  app.get("/api/config", {
    schema: {
      tags: ["Merchant"],
      summary: "获取门店公开配置",
      querystring: {
        type: "object",
        properties: { storeId: { type: "string" } },
      },
    },
  }, async (request) => {
    const query = request.query as { storeId?: string };
    return getConfig(prisma, query.storeId);
  });
}
