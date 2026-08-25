import { beforeEach, describe, expect, it } from "vitest";
import { useReviewFlowStore } from "./review-flow-store";

describe("review flow store", () => {
  beforeEach(() => useReviewFlowStore.getState().reset());
  it("enforces the five dish limit", () => {
    for (const id of ["1", "2", "3", "4", "5", "6"]) useReviewFlowStore.getState().toggleDish(id);
    expect(useReviewFlowStore.getState().dishIds).toHaveLength(5);
  });
  it("returns from reviews to message", () => expect(useReviewFlowStore.getState().previousScreen("reviews")).toBe("message"));
});
