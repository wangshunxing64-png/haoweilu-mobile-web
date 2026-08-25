import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DishSelectionScreen } from "./DishSelectionScreen";
import { ExperienceTagsScreen } from "./ExperienceTagsScreen";

describe("selection screens", () => {
  it("emits API dish ids", async () => { const onToggle = vi.fn(); render(<DishSelectionScreen dishes={[{ id: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" }]} selectedIds={[]} onToggle={onToggle} onNext={() => undefined} />); await userEvent.click(screen.getByRole("button", { name: /骨汤烫菜/ })); expect(onToggle).toHaveBeenCalledWith("bone-soup"); });
  it("renders tags from props", () => { render(<ExperienceTagsScreen tags={[{ id: "broth", name: "汤底鲜香" }]} selectedIds={[]} onToggle={() => undefined} onNext={() => undefined} />); expect(screen.getByRole("button", { name: "汤底鲜香" })).toBeVisible(); });
});
