import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RespondentApiError } from "@/lib/respondent-api/errors";
import type { RespondentProject } from "@/lib/respondent-api/types";
import RespondentPage from "./RespondentPage";

const api = vi.hoisted(() => ({ validateInvitation: vi.fn() }));
vi.mock("@/lib/respondent-api/client", () => ({ respondentApi: api }));

const TOKEN = "SECRET-TOKEN";

const project = (over: Partial<RespondentProject> = {}): RespondentProject => ({
  id: "p1",
  name: "Pilot test",
  status: "READY",
  limits: { maxDurationSeconds: 120, maxSizeBytes: 52428800, allowedContentTypes: ["video/webm", "video/mp4"] },
  progress: { questionnaireSubmitted: false, recordings: { camera: "NOT_STARTED", screen: "VERIFIED" } },
  ...over,
});

// Shows the router's current URL, and offers a way to open another link in the same "tab".
const UrlProbe = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{`${pathname}${search}${hash}`}</output>
      <button onClick={() => navigate("/test#invite=OTHER-TOKEN")}>open another link</button>
    </>
  );
};

const renderPage = (entry = `/test#invite=${TOKEN}`) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <RespondentPage />
      <UrlProbe />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  api.validateInvitation.mockResolvedValue(project());
});

describe("without a token", () => {
  it.each(["/test", "/test#", "/test#invite=", "/test#other=x"])("asks for the invitation link at %s", (entry) => {
    renderPage(entry);

    expect(screen.getByRole("heading", { name: "Invitation required" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toHaveAttribute("href", "/");
    expect(api.validateInvitation).not.toHaveBeenCalled();
  });
});

describe("with a token", () => {
  it("validates the token from the URL fragment", async () => {
    renderPage();

    await screen.findByText("Placeholder for the test");
    expect(api.validateInvitation).toHaveBeenCalledWith(TOKEN);
  });

  it("shows a spinner while the invitation is being validated", () => {
    api.validateInvitation.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the project details returned by the backend", async () => {
    renderPage();

    expect(await screen.findByText("Pilot test")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("120 seconds")).toBeInTheDocument();
    expect(screen.getByText("50 MB")).toBeInTheDocument();
    expect(screen.getByText("video/webm, video/mp4")).toBeInTheDocument();
    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("removes the token from the URL once it has been read, keeping the rest of the URL", async () => {
    renderPage(`/test?lang=en#invite=${TOKEN}`);

    expect(await screen.findByText("Pilot test")).toBeInTheDocument();
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test\?lang=en$/);
    expect(document.body.textContent).not.toContain(TOKEN);
  });

  it("validates once with the token it captured, not again after the URL is cleaned", async () => {
    renderPage();

    await screen.findByText("Pilot test");
    expect(api.validateInvitation).toHaveBeenCalledTimes(1);
    expect(api.validateInvitation).toHaveBeenCalledWith(TOKEN);
  });

  it("keeps showing the project after the URL no longer carries a token", async () => {
    renderPage();
    await screen.findByText("Pilot test");

    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test$/);
    expect(screen.queryByRole("heading", { name: "Invitation required" })).not.toBeInTheDocument();
  });

  it("switches to a new link opened in the same tab", async () => {
    renderPage();
    await screen.findByText("Pilot test");
    api.validateInvitation.mockResolvedValue(project({ name: "Another test" }));

    fireEvent.click(screen.getByRole("button", { name: "open another link" }));

    expect(await screen.findByText("Another test")).toBeInTheDocument();
    expect(api.validateInvitation).toHaveBeenLastCalledWith("OTHER-TOKEN");
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test$/);
  });

  it("never renders the token or writes it to storage", async () => {
    renderPage();
    await screen.findByText("Pilot test");

    expect(document.body.textContent).not.toContain(TOKEN);
    expect(JSON.stringify({ ...localStorage })).not.toContain(TOKEN);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(TOKEN);
  });
});

describe("errors", () => {
  it.each([
    ["invalid", 401, "This invitation link isn't valid."],
    ["expired", 410, "This invitation link has expired."],
    ["revoked", 410, "This invitation link has been withdrawn."],
    ["started", 410, "This test has already been started"],
    ["not_ready", 501, "The test service isn't available yet."],
  ] as const)("explains a %s link without offering a retry", async (kind, status, text) => {
    api.validateInvitation.mockRejectedValue(new RespondentApiError(kind, status));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(text);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(TOKEN);
  });

  it("retries after a network failure", async () => {
    api.validateInvitation.mockRejectedValueOnce(new RespondentApiError("network", 0));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Pilot test")).toBeInTheDocument();
    await waitFor(() => expect(api.validateInvitation).toHaveBeenCalledTimes(2));
  });

  it("falls back to a generic message for an unknown error", async () => {
    api.validateInvitation.mockRejectedValue(new Error("boom"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
