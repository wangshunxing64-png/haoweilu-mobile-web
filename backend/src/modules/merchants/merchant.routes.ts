import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AppStore } from "../../infrastructure/database/store.ts";
import { MerchantService } from "./merchant.service.ts";

const paramsSchema = z.object({ merchantId: z.string().min(1).max(64) });
const querySchema = z.object({ storeId: z.string().min(1).max(64).optional() });

export async function registerMerchantRoutes(
  app: FastifyInstance,
  store: AppStore,
  publicApiBaseUrl: string,
): Promise<void> {
  const service = new MerchantService(store, publicApiBaseUrl);

  app.get("/api/merchants/:merchantId", {
    schema: {
      tags: ["Merchant"],
      summary: "获取商户、门店与评价流程配置",
    },
  }, async (request) => {
    const { merchantId } = paramsSchema.parse(request.params);
    const { storeId } = querySchema.parse(request.query);
    return service.get(merchantId, storeId);
  });
}
