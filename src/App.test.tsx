import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const api = vi.hoisted(() => ({ validateInvitation: vi.fn() }));
vi.mock("@/lib/respondent-api/client", () => ({ respondentApi: api }));

const renderAt = (url: string) => {
  window.history.pushState({}, "", url);
  return render(<App />);
};

beforeEach(() => api.validateInvitation.mockReset());
afterEach(() => window.history.pushState({}, "", "/"));

describe("App routes", () => {
  it("serves the respondent placeholder at /test, not the old demo", async () => {
    api.validateInvitation.mockResolvedValue({
      id: "p1",
      name: "Pilot test",
      status: "READY",
      limits: { maxDurationSeconds: 120, maxSizeBytes: 52428800, allowedContentTypes: ["video/webm"] },
      progress: { questionnaireSubmitted: false, recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" } },
    });
    renderAt("/test#invite=SECRET-TOKEN");

    expect(await screen.findByText("Placeholder for the test")).toBeInTheDocument();
    expect(api.validateInvitation).toHaveBeenCalledWith("SECRET-TOKEN");
    // The token is gone from the address bar (and the history entry) once it has been read.
    expect(window.location.pathname).toBe("/test");
    expect(window.location.hash).toBe("");
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("SECRET-TOKEN");
  });

  it("asks for an invitation link at /test without a token", async () => {
    renderAt("/test");

    expect(await screen.findByRole("heading", { name: "Invitation required" })).toBeInTheDocument();
    expect(api.validateInvitation).not.toHaveBeenCalled();
  });

  it("renders the old demo flow at the dev-only /dev/test-demo route", async () => {
    renderAt("/dev/test-demo");

    expect(await screen.findByText("DEMO")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Invitation required" })).not.toBeInTheDocument();
  });
});
