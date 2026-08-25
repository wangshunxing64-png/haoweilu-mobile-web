import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.ts";
import { isFastifyValidationError } from "./validation-error.ts";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          requestId: request.id,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "请求参数不合法",
          requestId: request.id,
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (isFastifyValidationError(error)) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "请求参数不合法",
          requestId: request.id,
          details: (error.validation ?? []).map((issue) => ({
            path: issue.instancePath || error.validationContext || "request",
            message: issue.message || "参数格式错误",
          })),
        },
      });
    }

    const unexpectedError = error instanceof Error ? error : new Error("Unknown request error");
    const unexpectedStatusCode = typeof (error as { statusCode?: unknown })?.statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : undefined;

    if (unexpectedStatusCode === 429) {
      return reply.code(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "请求过于频繁，请稍后重试",
          requestId: request.id,
        },
      });
    }

    request.log.error(
      {
        err: {
          name: unexpectedError.name,
          message: unexpectedError.message,
          stack: unexpectedError.stack,
        },
      },
      "Unhandled request error",
    );

    return reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "服务暂时不可用，请稍后重试",
        requestId: request.id,
      },
    });
  });
}
