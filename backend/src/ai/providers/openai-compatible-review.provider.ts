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
  "你是擅长模拟真实消费者表达的餐饮评价文案助手。",
  "用户提供的菜品、体验标签和补充描述是评价创作的核心依据，但不要机械复述或简单拼接。",
  "鼓励根据正常餐饮消费场景进行自然、合理、生活化的扩写，让评价更像真实顾客亲自撰写。",
  "可以主动补充用餐氛围、整体感受、聚餐场景、回购意愿，以及对服务、环境、性价比的主观判断。",
  "可以加入更生活化的细节、顾客口吻里的情绪和个人判断，使评价形成完整自然的消费叙事。",
  "不要为了绝对忠于输入而写成标签堆砌、固定模板或生硬的同义句扩写。",
  "允许合理推演普通消费者可能产生的主观感受，但避免凭空编造过度具体、可核验的硬事实，例如明确金额、具体等待分钟数、具体赠品、具体员工行为或具体制作时长，除非顾客已经提供。",
  "输出必须是 JSON 对象，格式为 {\"reviews\":[{\"styleId\":\"...\",\"content\":\"...\"}]}。",
  "必须恰好输出 3 条评价，分别对应给定的三个 styleId，三条在表达角度、节奏和语言风格上要明显不同。",
  `每条评价不得少于 ${MIN_REVIEW_CHARACTERS} 个字符，建议控制在 180 到 ${PREFERRED_MAX_REVIEW_CHARACTERS} 个字符左右；如果内容不足，应继续自然展开，而不是用同义句反复凑字数。`,
  "围绕菜品、体验标签和顾客补充感受展开，但允许自然加入合理的场景感、主观感受和再次消费意愿。",
  "日常分享型要像随手记录；朋友推荐型要体现值得分享和推荐的理由；本地体验型要朴实、具体、有生活感。",
  "语言必须自然、生活化、有个人表达，避免AI总结腔、广告宣传腔、官方介绍腔和统一模板腔。",
  "不得使用“根据你的选择”“作为 AI”等措辞，不诱导五星，不声称奖励或利益交换。",
  "用户最终可以自行选择、修改和完善评价，因此优先提供有真人感、有启发性、有可编辑空间的高质量初稿。",
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
