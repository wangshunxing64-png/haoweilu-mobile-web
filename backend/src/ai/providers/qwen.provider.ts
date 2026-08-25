import type { GeneratedReview, ReviewGenerationContext, ReviewProvider } from "../types.ts";

/**
 * Reserved adapter boundary for a future Qwen integration.
 * Keeping this provider explicit means switching providers will not require route changes.
 */
export class QwenProvider implements ReviewProvider {
  readonly name = "qwen";

  async generate(_context: ReviewGenerationContext): Promise<GeneratedReview[]> {
    throw new Error("Qwen provider is not configured");
  }
}
