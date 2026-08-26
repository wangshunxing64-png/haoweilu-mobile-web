import type {
  GeneratedReview,
  ReviewGenerationContext,
  ReviewProvider,
} from "../types.ts";

import {
  countReviewCharacters,
  MIN_REVIEW_CHARACTERS,
} from "../review-constraints.ts";

const TARGET_LOCAL_REVIEW_CHARACTERS = Math.max(
  MIN_REVIEW_CHARACTERS,
  130,
);

function renderTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(
    /{(\w+)}/g,
    (_, key: string) => values[key] ?? "",
  );
}

function cleanContent(content: string): string {
  return content
    .replace(/。{2,}/g, "。")
    .replace(/\s+/g, "")
    .trim();
}

function styleAdditions(
  styleId: string,
  dishText: string,
  tagText: string,
): string[] {
  const common = [
    `这次吃下来对${dishText}的印象比较深，${tagText}这些感受也比较明显，整体吃得挺顺口，属于会让人自然记住的一顿。`,
    "整个用餐感受比较轻松，没有那种刻意追求花哨的感觉，反而是这种自然、舒服的体验更容易让人产生再次来吃的想法。",
    "如果之后和朋友或者家里人想吃点热乎、踏实的东西，我应该还会愿意再来试试，整体给人的感觉比较耐吃。",
  ];

  if (styleId === "friend") {
    return [
      `如果朋友问我这次吃得怎么样，我会比较愿意提到${dishText}，${tagText}这些地方都挺容易让人留下印象。`,
      "这种体验不是特别夸张的那种惊艳，而是吃完整体感觉舒服、顺口，会让人愿意自然分享给身边朋友。",
      "平时朋友一起吃饭，大家其实更在意味道合不合口、吃得舒不舒服，这次整体表现让我觉得是可以再约着来一次的类型。",
      ...common,
    ];
  }

  if (styleId === "local") {
    return [
      `${dishText}整体属于比较耐吃的路子，${tagText}这些感受组合在一起，吃完整顿饭不会觉得负担重，反而挺有日常烟火气。`,
      "我比较喜欢这种不需要太多包装、吃起来舒服自然的感觉，作为平时想认真吃顿饭的选择会比较合适。",
      "如果以后刚好在附近或者突然想吃这一口，我觉得还是会愿意再过来，属于比较容易形成回头客印象的类型。",
      ...common,
    ];
  }

  return [
    `这次主要吃了${dishText}，${tagText}这些感受比较直接，整体不是那种只适合拍照的体验，而是真的吃下来觉得挺舒服。`,
    "从第一口到吃完整体节奏都比较自然，味道和用餐感受没有让人觉得刻意，属于比较容易接受、也比较耐吃的类型。",
    "如果之后再想吃类似的口味，我应该会愿意把这家重新放进选择里，日常和朋友一起过来吃也比较合适。",
    ...common,
  ];
}

function expandNaturally(
  baseContent: string,
  styleId: string,
  dishNames: string[],
  tagNames: string[],
): string {
  const dishText =
    dishNames.join("、") || "这次点的几道菜";

  const tagText =
    tagNames.length > 0
      ? tagNames.join("、")
      : "整体味道和用餐感受";

  const additions = styleAdditions(
    styleId,
    dishText,
    tagText,
  );

  let result = cleanContent(baseContent);

  for (const addition of additions) {
    if (
      countReviewCharacters(result)
      >= TARGET_LOCAL_REVIEW_CHARACTERS
    ) {
      break;
    }

    result = cleanContent(
      `${result}${addition}`,
    );
  }

  return result;
}

export class LocalFallbackProvider
  implements ReviewProvider
{
  readonly name = "local-template";

  async generate(
    context: ReviewGenerationContext,
  ): Promise<GeneratedReview[]> {
    const { merchant, input } = context;

    const dishNames = input.dishes;
    const tagNames = input.tags;
    const message = input.message.trim();

    const values = {
      merchantName: merchant.name,

      dishText:
        dishNames.join("、")
        || "店里的几道菜",

      tagSentence:
        tagNames.length > 0
          ? `${tagNames.join("、")}。`
          : "",

      messageSentence:
        message
          ? `我自己最直接的感受是“${message}”`
          : "",
    };

    return merchant.reviewStyles.map(
      (style) => {
        const baseContent = renderTemplate(
          style.template,
          values,
        );

        const content = expandNaturally(
          baseContent,
          style.id,
          dishNames,
          tagNames,
        );

        return {
          id: `review-${style.id}`,
          styleId: style.id,
          styleName: style.name,
          styleLabel: style.label,
          content,
          provider: this.name,
          model: "local-template",
        };
      },
    );
  }
}
