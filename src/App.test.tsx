import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const renderAt = (url: string) => {
  window.history.pushState({}, "", url);
  return render(<App />);
};

afterEach(() => window.history.pushState({}, "", "/"));

describe("App routes", () => {
  it("serves the respondent placeholder at /test, not the old demo", () => {
    renderAt("/test#invite=SECRET-TOKEN");

    expect(screen.getByRole("heading", { name: "Invitation required" })).toBeInTheDocument();
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("SECRET-TOKEN");
  });

  it("renders the old demo flow at the dev-only /dev/test-demo route", async () => {
    renderAt("/dev/test-demo");

    expect(await screen.findByText("DEMO")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Invitation required" })).not.toBeInTheDocument();
  });
});
