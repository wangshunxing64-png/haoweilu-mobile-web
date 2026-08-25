import { describe, expect, it } from "vitest";
import { platformLaunchTarget, platformScheme } from "./app-launcher";

describe("platformScheme", () => {
  it("uses domestic app schemes", () => {
    expect(platformScheme("meituan")).toBe("imeituan://");
    expect(platformScheme("dianping")).toBe("dianping://");
  });
});

describe("platformLaunchTarget", () => {
  it("prefers the Li Ji store share link over an older Meituan scheme returned by the API", () => {
    expect(platformLaunchTarget("meituan", "imeituan://")).toBe("https://dpurl.cn/swRRFoqz");
  });

  it("keeps the prepared Dianping target", () => {
    expect(platformLaunchTarget("dianping", "dianping://")).toBe("dianping://");
  });
});
