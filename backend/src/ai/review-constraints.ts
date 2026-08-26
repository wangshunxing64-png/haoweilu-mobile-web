export const MIN_REVIEW_CHARACTERS = 150;

export function countReviewCharacters(content: string): number {
  return Array.from(content.trim()).length;
}

export function meetsMinimumReviewLength(content: string): boolean {
  return countReviewCharacters(content) >= MIN_REVIEW_CHARACTERS;
}
