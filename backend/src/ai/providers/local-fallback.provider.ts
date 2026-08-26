import type {
  GeneratedReview,
  ReviewGenerationContext,
  ReviewProvider,
} from "../types.ts";
import {
  countReviewCharacters,
  MIN_REVIEW_CHARACTERS,
} from "../review-constraints.ts";

function getSelectedNames<T extends { id: string; name: string }>(collection: T[], selectedIds: string[]): string[] {
  const selected = new Set(selectedIds);
  return collection.filter((item) => selected.has(item.id)).map((item) => item.name);
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function expandWithKnownFacts(
  content: string,
  dishNames: string[],
  tagNames: string[],
  message: string,
): string {
  const dishText = dishNames.join("、") || "这次已经选择的菜品";
  const tagText = tagNames.length
    ? `我勾选的真实感受是${tagNames.join("、")}`
    : "这次没有额外补充其他体验细节";
  const messageText = message
    ? `我另外写下的感受是“${message}”，这也是这段评价想保留的重点`
    : "除此之外没有补充更多内容，所以这里只保留已经确认的信息";
  const additions = [
    `这次最想记录的菜品是${dishText}，${tagText}。`,
    `${messageText}。`,
    "整段评价都围绕这次实际选择和填写的内容展开，没有加入未提供的服务、环境、价格或其他消费细节。",
    "比起堆砌夸张的形容，更重要的是把确实留下印象的菜品和感受说明白，让看到这段话的人了解这次体验中真正被记录下来的部分。",
  ];
  let expanded = content;
  let index = 0;
  while (countReviewCharacters(expanded) < MIN_REVIEW_CHARACTERS) {
    expanded = `${expanded}${additions[index % additions.length]}`;
    index += 1;
  }
  return expanded;
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

    return merchant.reviewStyles.map((style) => {
      const rendered = renderTemplate(style.template, values).replace(/。{2,}/g, "。").trim();
      return {
        id: `review-${style.id}`,
        styleId: style.id,
        styleName: style.name,
        styleLabel: style.label,
        content: expandWithKnownFacts(rendered, dishNames, tagNames, message),
        provider: this.name,
        model: "local-template",
      };
    });
  }
}
