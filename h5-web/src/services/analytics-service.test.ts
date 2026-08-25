import { describe, expect, it } from "vitest";
import { sanitizePayload } from "./analytics-service";
describe("analytics sanitization", () => { it("removes raw user text", () => expect(sanitizePayload({ reviewId: "r1", content: "原文", message: "感受" })).toEqual({ reviewId: "r1" })); });
