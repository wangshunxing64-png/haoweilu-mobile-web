import type { GeneratedReview, ReviewGenerationContext, ReviewProvider } from "../types.ts";
import {
  MIN_REVIEW_CHARACTERS,
  PREFERRED_MAX_REVIEW_CHARACTERS,
} from "../review-constraints.ts";

export interface OpenAiCompatibleProviderOptions {
  name: string; errorLabel: string; apiKey: string; baseUrl: string; model: string;
  timeoutMs?: number; fetchImpl?: typeof fetch; extraBody?: Record<string, unknown>;
  maxRateLimitRetries?: number;
}

interface ApiResponse { choices?: Array<{ message?: { content?: string | null } }> }
interface ParsedReviews { reviews?: Array<{ styleId?: string; content?: string }> }

const RATE_LIMIT_RETRY_DELAYS_MS = [750, 1_500];
const MAX_RATE_LIMIT_DELAY_MS = 5_000;

function rateLimitDelayMs(response: Response, retryIndex: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1_000, MAX_RATE_LIMIT_DELAY_MS);
    }
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(0, retryAt - Date.now()), MAX_RATE_LIMIT_DELAY_MS);
    }
  }
  return RATE_LIMIT_RETRY_DELAYS_MS[retryIndex] ?? RATE_LIMIT_RETRY_DELAYS_MS.at(-1) ?? 0;
}

async function wait(delayMs: number): Promise<void> {
  if (delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

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
      `每条评价控制在 ${MIN_REVIEW_CHARACTERS} 到 ${PREFERRED_MAX_REVIEW_CHARACTERS} 个字符，写成一段可直接发布的自然口语，不要标题或分点。`,
      "围绕已提供的菜品、体验标签和补充感受逐步展开，先说总体感受，再写具体印象，最后自然收束。",
      "日常分享型要像随手记录；朋友推荐型要说清值得分享的理由；本地体验型要朴实、具体、有生活感。",
      "避免重复、空话和机器表达，不得使用“根据你的选择”“作为 AI”等措辞，不得用同义句反复凑字数。",
      "保留顾客补充原话的核心语义，不夸大，不诱导五星，不声称奖励或利益交换。",
    ].join("\n");
    const userPayload = { merchantName: context.merchant.name, dishes: context.input.dishes,
      experienceTags: context.input.tags, userMessage: context.input.message.trim(), styles };
    const requestBody = JSON.stringify({ model: this.options.model, messages: [
      { role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(userPayload) },
    ], response_format: { type: "json_object" }, temperature: 0.8, max_tokens: 1200, ...this.options.extraBody });
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const maxRateLimitRetries = this.options.maxRateLimitRetries
      ?? RATE_LIMIT_RETRY_DELAYS_MS.length;
    let response: Response;
    for (let attempt = 0; ; attempt += 1) {
      response = await fetchImpl(`${this.options.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.options.apiKey}`, "Content-Type": "application/json" },
        body: requestBody,
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 12_000),
      });
      if (response.status !== 429 || attempt >= maxRateLimitRetries) break;
      await response.arrayBuffer();
      await wait(rateLimitDelayMs(response, attempt));
    }
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
