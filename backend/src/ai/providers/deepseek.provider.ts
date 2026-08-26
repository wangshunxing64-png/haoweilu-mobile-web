import { OpenAiCompatibleReviewProvider } from "./openai-compatible-review.provider.ts";

interface DeepSeekProviderOptions { apiKey: string; baseUrl?: string; model?: string; timeoutMs?: number; fetchImpl?: typeof fetch }

export class DeepSeekProvider extends OpenAiCompatibleReviewProvider {
  constructor(options: DeepSeekProviderOptions) {
    super({ name: "deepseek", errorLabel: "DeepSeek", apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? "https://api.deepseek.com", model: options.model ?? "deepseek-v4-flash",
      timeoutMs: options.timeoutMs, fetchImpl: options.fetchImpl,
      extraBody: { thinking: { type: "disabled" } } });
  }
}
