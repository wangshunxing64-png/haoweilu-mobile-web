import { AppError } from "../errors/app-error.ts";

export function assertAllowedUserMessage(message: string, blockedTerms: string[]): void {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return;

  const matched = blockedTerms.some((term) => {
    const candidate = term.trim().toLowerCase();
    return candidate.length > 0 && normalized.includes(candidate);
  });

  if (matched) {
    throw new AppError("CONTENT_BLOCKED", "补充内容包含当前系统不接受的内容，请修改后重试", 400);
  }
}
