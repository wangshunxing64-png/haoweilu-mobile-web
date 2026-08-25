import { beforeEach, describe, expect, it } from "vitest";
import { clearSessionCache, readSessionCache, saveSessionCache } from "./session-cache";
describe("session cache", () => {
  beforeEach(() => sessionStorage.clear());
  it("stores recoverable workflow ids without raw user text", () => {
    saveSessionCache("liji", "main", { sessionId: "s1", screen: "additional-message", dishIds: ["d1"], tagIds: ["t1"], selectedReviewId: "" });
    expect(readSessionCache("liji", "main")).toMatchObject({ sessionId: "s1", screen: "additional-message", dishIds: ["d1"], tagIds: ["t1"] });
    expect(JSON.parse(sessionStorage.getItem("haoweilu:liji:main:session:v1") || "{}")).not.toHaveProperty("message");
  });
  it("can clear a completed workflow", () => {
    saveSessionCache("liji", "main", { sessionId: "s1", screen: "home", dishIds: [], tagIds: [], selectedReviewId: "" });
    clearSessionCache("liji", "main");
    expect(readSessionCache("liji", "main")).toBeUndefined();
  });
});
