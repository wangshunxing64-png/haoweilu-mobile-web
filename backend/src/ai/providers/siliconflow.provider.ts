import { OpenAiCompatibleReviewProvider } from "./openai-compatible-review.provider.ts";

interface SiliconFlowProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class SiliconFlowProvider extends OpenAiCompatibleReviewProvider {
  constructor(options: SiliconFlowProviderOptions) {
    super({
      name: "siliconflow",
      errorLabel: "SiliconFlow",
      apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? "https://api.siliconflow.cn/v1",
      model: options.model ?? "Qwen/Qwen3-8B",
      timeoutMs: options.timeoutMs,
      fetchImpl: options.fetchImpl,

      // Qwen3 餐饮评价生成不需要推理模式。
      // 关闭后可以显著减少 token 消耗和响应延迟。
      extraBody: {
        enable_thinking: false,
      },

      // 首次请求遇到 429 后只重试 1 次。
      // 第二次仍为 429 时抛出错误，由 ReviewGenerator 切换 DeepSeek。
      maxRateLimitRetries: 1,
    });
  }
}