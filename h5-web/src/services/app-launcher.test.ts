import { describe, expect, it } from "vitest";
import { platformScheme } from "./app-launcher";

describe("platformScheme", () => {
  it("uses domestic app schemes", () => {
    expect(platformScheme("meituan")).toBe("imeituan://");
    expect(platformScheme("dianping")).toBe("dianping://");
  });
});
