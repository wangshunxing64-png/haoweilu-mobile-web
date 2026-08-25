import type {
  GeneratedReview,
  ReviewGenerationContext,
  ReviewProvider,
} from "../types.ts";

interface DeepSeekProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface DeepSeekApiResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface ParsedReviews {
  reviews?: Array<{
    styleId?: string;
    content?: string;
  }>;
}

function selectedNames<T extends { id: string; name: string }>(items: T[], ids: string[]): string[] {
  const selected = new Set(ids);
  return items.filter((item) => selected.has(item.id)).map((item) => item.name);
}

export class DeepSeekProvider implements ReviewProvider {
  readonly name = "deepseek";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DeepSeekProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.deepseek.com").replace(/\/+$/, "");
    this.model = options.model ?? "deepseek-chat";
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generate(context: ReviewGenerationContext): Promise<GeneratedReview[]> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key is not configured");
    }

    const { merchant, input } = context;
    const dishNames = input.dishes;
    const tagNames = input.tags;
    const styles = merchant.reviewStyles.map((style) => ({
      styleId: style.id,
      name: style.name,
      label: style.label,
    }));

    const systemPrompt = [
      "你是餐饮真实体验表达助手。",
      "你的职责是把顾客已经提供的真实体验整理得自然、清楚，不得虚构未提供的菜品、服务、环境、价格、排队、人物或消费事实。",
      "输出必须是 JSON 对象，格式为 {\"reviews\":[{\"styleId\":\"...\",\"content\":\"...\"}]}。",
      "必须恰好输出 3 条评价，分别对应给定的三个 styleId，三条表达明显不同，但事实必须一致。",
      "如果顾客提供了补充原话，保留其核心语义，不夸大，不诱导五星，不声称奖励或利益交换。",
    ].join("\n");

    const userPayload = {
      merchantName: merchant.name,
      dishes: dishNames,
      experienceTags: tagNames,
      userMessage: input.message.trim(),
      styles,
    };

    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed: ${response.status}`);
    }

    const payload = (await response.json()) as DeepSeekApiResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek response contained no message content");
    }

    let parsed: ParsedReviews;
    try {
      parsed = JSON.parse(content) as ParsedReviews;
    } catch {
      throw new Error("AI返回格式错误");
    }
    if (!Array.isArray(parsed.reviews)) {
      throw new Error("DeepSeek response contained no reviews array");
    }

    return parsed.reviews.map((review, index) => {
      const style = merchant.reviewStyles.find((item) => item.id === review.styleId)
        ?? merchant.reviewStyles[index];
      return {
        id: `review-${style?.id ?? index + 1}`,
        styleId: style?.id ?? review.styleId ?? `style-${index + 1}`,
        styleName: style?.name ?? "AI 评价",
        styleLabel: style?.label ?? "真实表达",
        content: String(review.content ?? "").trim(),
        provider: this.name,
        model: this.model,
      };
    });
  }
}
