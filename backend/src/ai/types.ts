import type { MerchantConfig } from "../modules/merchants/merchant.types.ts";

export interface ReviewInput {
  dishIds: string[];
  tagIds: string[];
  dishes: string[];
  tags: string[];
  message: string;
}

export interface ReviewGenerationContext {
  merchant: MerchantConfig;
  input: ReviewInput;
}

export interface GeneratedReview {
  id: string;
  styleId: string;
  styleName: string;
  styleLabel: string;
  content: string;
  provider?: string;
  model?: string;
}

export interface ReviewProvider {
  readonly name: string;
  generate(context: ReviewGenerationContext): Promise<GeneratedReview[]>;
}
