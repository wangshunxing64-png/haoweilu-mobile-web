export interface FastifyValidationIssue {
  instancePath?: string;
  schemaPath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
}

export interface FastifyValidationLikeError {
  code?: string;
  statusCode?: number;
  validation?: FastifyValidationIssue[];
  validationContext?: string;
}

export function isFastifyValidationError(error: unknown): error is FastifyValidationLikeError {
  if (!error || typeof error !== "object") return false;
  const candidate = error as FastifyValidationLikeError;
  return candidate.code === "FST_ERR_VALIDATION"
    || (candidate.statusCode === 400 && Array.isArray(candidate.validation));
}
