import { OpenAiCompatibleReviewProvider } from "./openai-compatible-review.provider.ts";

interface ZhipuProviderOptions { apiKey: string; baseUrl?: string; model?: string; timeoutMs?: number; fetchImpl?: typeof fetch }

export class ZhipuProvider extends OpenAiCompatibleReviewProvider {
  constructor(options: ZhipuProviderOptions) {
    super({ name: "zhipu", errorLabel: "Zhipu", apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? "https://open.bigmodel.cn/api/paas/v4",
      model: options.model ?? "glm-4.7-flash", timeoutMs: options.timeoutMs, fetchImpl: options.fetchImpl,
      extraBody: { thinking: { type: "disabled" } }, maxRateLimitRetries: 1 });
  }
}
