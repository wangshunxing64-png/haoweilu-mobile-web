export const MIN_REVIEW_CHARACTERS = 100;
export const PREFERRED_MAX_REVIEW_CHARACTERS = 180;

export function countReviewCharacters(content: string): number {
  return Array.from(content.trim()).length;
}

export function meetsMinimumReviewLength(content: string): boolean {
  return countReviewCharacters(content) >= MIN_REVIEW_CHARACTERS;
}