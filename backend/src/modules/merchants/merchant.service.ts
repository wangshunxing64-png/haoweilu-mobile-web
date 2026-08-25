import { AppError } from "../../common/errors/app-error.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import type { MerchantConfig } from "./merchant.types.ts";

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return base ? `${base}${path}` : path;
}

export class MerchantService {
  private readonly store: AppStore;
  private readonly publicApiBaseUrl: string;

  constructor(store: AppStore, publicApiBaseUrl: string) {
    this.store = store;
    this.publicApiBaseUrl = publicApiBaseUrl;
  }

  async get(merchantId: string, storeId?: string): Promise<MerchantConfig> {
    const merchant = await this.store.getMerchant(merchantId, storeId);
    if (!merchant) {
      throw new AppError("MERCHANT_NOT_FOUND", "商户或门店不存在", 404);
    }

    return {
      ...merchant,
      ai: {
        provider: merchant.ai.provider,
        endpoint: joinUrl(this.publicApiBaseUrl, "/api/reviews/generate"),
        model: merchant.ai.model,
        fallbackToLocal: merchant.ai.fallbackToLocal,
      },
    };
  }
}
