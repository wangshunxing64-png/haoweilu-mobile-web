import assert from "node:assert/strict";
import test from "node:test";

import { isFastifyValidationError } from "../../src/common/http/validation-error.ts";

test("recognizes Fastify schema validation failures so they are returned as HTTP 400", () => {
  assert.equal(isFastifyValidationError({
    code: "FST_ERR_VALIDATION",
    statusCode: 400,
    validation: [{ instancePath: "/merchantId", message: "must have required property" }],
  }), true);
  assert.equal(isFastifyValidationError(new Error("database down")), false);
});
