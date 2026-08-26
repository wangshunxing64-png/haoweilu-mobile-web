import type { GeneratedReview, ReviewGenerationContext, ReviewProvider } from "../types.ts";
import { MIN_REVIEW_CHARACTERS } from "../review-constraints.ts";

export interface OpenAiCompatibleProviderOptions {
  name: string; errorLabel: string; apiKey: string; baseUrl: string; model: string;
  timeoutMs?: number; fetchImpl?: typeof fetch; extraBody?: Record<string, unknown>;
}

interface ApiResponse { choices?: Array<{ message?: { content?: string | null } }> }
interface ParsedReviews { reviews?: Array<{ styleId?: string; content?: string }> }

export class OpenAiCompatibleReviewProvider implements ReviewProvider {
  readonly name: string;
  private readonly options: OpenAiCompatibleProviderOptions;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.name = options.name;
    this.options = { ...options, baseUrl: options.baseUrl.replace(/\/+$/, "") };
  }

  async generate(context: ReviewGenerationContext): Promise<GeneratedReview[]> {
    if (!this.options.apiKey) throw new Error(`${this.options.errorLabel} API key is not configured`);
    const styles = context.merchant.reviewStyles.map(({ id, name, label }) => ({ styleId: id, name, label }));
    const systemPrompt = [
      "你是餐饮真实体验表达助手。",
      "只能整理顾客已提供的真实体验，不得虚构菜品、服务、环境、价格、排队、人物或消费事实。",
      "输出必须是 JSON 对象，格式为 {\"reviews\":[{\"styleId\":\"...\",\"content\":\"...\"}]}。",
      "必须恰好输出 3 条评价，分别对应给定的三个 styleId，表达明显不同但事实一致。",
      `每条评价不少于 ${MIN_REVIEW_CHARACTERS} 个字符，内容完整自然，不得用重复句子凑字数。`,
      "保留顾客补充原话的核心语义，不夸大，不诱导五星，不声称奖励或利益交换。",
    ].join("\n");
    const userPayload = { merchantName: context.merchant.name, dishes: context.input.dishes,
      experienceTags: context.input.tags, userMessage: context.input.message.trim(), styles };
    const response = await (this.options.fetchImpl ?? fetch)(`${this.options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.options.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.options.model, messages: [
        { role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(userPayload) },
      ], response_format: { type: "json_object" }, temperature: 0.8, max_tokens: 1200, ...this.options.extraBody }),
      signal: AbortSignal.timeout(this.options.timeoutMs ?? 12_000),
    });
    if (!response.ok) throw new Error(`${this.options.errorLabel} request failed: ${response.status}`);
    const content = ((await response.json()) as ApiResponse).choices?.[0]?.message?.content;
    if (!content) throw new Error(`${this.options.errorLabel} response contained no message content`);
    let parsed: ParsedReviews;
    try { parsed = JSON.parse(content) as ParsedReviews; } catch { throw new Error("AI返回格式错误"); }
    if (!Array.isArray(parsed.reviews)) throw new Error(`${this.options.errorLabel} response contained no reviews array`);
    return parsed.reviews.map((review, index) => {
      const style = context.merchant.reviewStyles.find((item) => item.id === review.styleId) ?? context.merchant.reviewStyles[index];
      return { id: `review-${style?.id ?? index + 1}`, styleId: style?.id ?? review.styleId ?? `style-${index + 1}`,
        styleName: style?.name ?? "AI 评价", styleLabel: style?.label ?? "真实表达",
        content: String(review.content ?? "").trim(), provider: this.name, model: this.options.model };
    });
  }
}
