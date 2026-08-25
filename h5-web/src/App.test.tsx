import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the mainland H5 shell", () => {
    render(<App />);
    expect(screen.getByRole("main", { name: "好味录" })).toBeInTheDocument();
  });
});
