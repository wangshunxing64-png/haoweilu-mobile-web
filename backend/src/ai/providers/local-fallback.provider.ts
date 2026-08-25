import type {
  GeneratedReview,
  ReviewGenerationContext,
  ReviewProvider,
} from "../types.ts";

function getSelectedNames<T extends { id: string; name: string }>(collection: T[], selectedIds: string[]): string[] {
  const selected = new Set(selectedIds);
  return collection.filter((item) => selected.has(item.id)).map((item) => item.name);
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export class LocalFallbackProvider implements ReviewProvider {
  readonly name = "local-template";

  async generate(context: ReviewGenerationContext): Promise<GeneratedReview[]> {
    const { merchant, input } = context;
    const dishNames = input.dishes;
    const tagNames = input.tags;
    const message = input.message.trim();

    const values = {
      merchantName: merchant.name,
      dishText: dishNames.join("、") || "店里的招牌菜",
      tagSentence: tagNames.length ? `${tagNames.join("、")}。` : "",
      messageSentence: message ? `“${message}”` : "",
    };

    return merchant.reviewStyles.map((style) => ({
      id: `review-${style.id}`,
      styleId: style.id,
      styleName: style.name,
      styleLabel: style.label,
      content: renderTemplate(style.template, values).replace(/。{2,}/g, "。").trim(),
      provider: this.name,
      model: "local-template",
    }));
  }
}
