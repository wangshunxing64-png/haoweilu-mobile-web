import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../src/common/errors/app-error.ts";
import { assertAllowedUserMessage } from "../../src/common/content/content-guard.ts";

test("content guard allows normal restaurant experience text", () => {
  assert.doesNotThrow(() => assertAllowedUserMessage("酸菜蹄膀很香，分量也足", ["刷单", "返现"]));
});

test("content guard rejects configured sensitive terms without echoing the raw message", () => {
  assert.throws(
    () => assertAllowedUserMessage("这里要求刷单返现", ["刷单", "返现"]),
    (error: unknown) => error instanceof AppError
      && error.code === "CONTENT_BLOCKED"
      && !error.message.includes("这里要求刷单返现"),
  );
});
