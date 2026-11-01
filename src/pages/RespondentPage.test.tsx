import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RespondentApiError } from "@/lib/respondent-api/errors";
import type { RespondentProject } from "@/lib/respondent-api/types";
import RespondentPage from "./RespondentPage";

const api = vi.hoisted(() => ({ validateInvitation: vi.fn(), submitQuestionnaire: vi.fn() }));
vi.mock("@/lib/respondent-api/client", () => ({ respondentApi: api }));

const answers = vi.hoisted(() => ({
  pre: { problemToSolve: "Slow onboarding", buyMotivation: "Saves time", budgetRange: "€1-5K", urgency: 4 },
  post: {
    disappointed: "Very disappointed",
    wouldBuy: "Yes",
    mostConfusing: "Pricing",
    likedMost: "Speed",
    whatsMissing: "Export",
  },
}));

// The real surveys use Radix Select, which cannot be driven with fireEvent in jsdom, and the real
// recording session needs camera and screen capture. These stubs submit canned data instead.
interface StepProps {
  onComplete: (data?: unknown) => void | Promise<void>;
  error?: ReactNode;
}
vi.mock("@/components/PreSurvey", () => ({
  default: ({ onComplete, error }: StepProps) => (
    <section>
      <h2>Pre-survey step</h2>
      {error}
      <button onClick={() => void onComplete(answers.pre)}>submit pre-survey</button>
    </section>
  ),
}));
vi.mock("@/components/RecordingSession", () => ({
  default: ({ onComplete }: StepProps) => (
    <section>
      <h2>Recording step</h2>
      <button onClick={() => void onComplete()}>finish recording</button>
    </section>
  ),
}));
vi.mock("@/components/PostSurvey", () => ({
  default: ({ onComplete, error }: StepProps) => (
    <section>
      <h2>Post-survey step</h2>
      {error}
      <button onClick={() => void onComplete(answers.post)}>submit post-survey</button>
    </section>
  ),
}));

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
  api.submitQuestionnaire.mockResolvedValue({ submittedAt: "2026-11-01T10:00:00Z" });
});

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const preSurvey = () => screen.findByRole("heading", { name: "Pre-survey step" });
const recording = () => screen.findByRole("heading", { name: "Recording step" });
const postSurvey = () => screen.findByRole("heading", { name: "Post-survey step" });

// Walks a respondent from the pre-survey up to the post-survey.
const reachPostSurvey = async () => {
  renderPage();
  await preSurvey();
  click("submit pre-survey");
  await recording();
  click("finish recording");
  await postSurvey();
};

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

    await preSurvey();
    expect(api.validateInvitation).toHaveBeenCalledWith(TOKEN);
  });

  it("shows a spinner while the invitation is being validated", () => {
    api.validateInvitation.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("starts with the pre-survey and the step indicator, without the demo badge", async () => {
    renderPage();

    await preSurvey();
    expect(screen.getByText("Pre-Survey", { selector: "[aria-current=page]" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(api.submitQuestionnaire).not.toHaveBeenCalled();
  });

  it("removes the token from the URL once it has been read, keeping the rest of the URL", async () => {
    renderPage(`/test?lang=en#invite=${TOKEN}`);

    await preSurvey();
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test\?lang=en$/);
    expect(document.body.textContent).not.toContain(TOKEN);
  });

  it("validates once with the token it captured, not again after the URL is cleaned", async () => {
    renderPage();

    await preSurvey();
    expect(api.validateInvitation).toHaveBeenCalledTimes(1);
    expect(api.validateInvitation).toHaveBeenCalledWith(TOKEN);
  });

  it("keeps showing the project after the URL no longer carries a token", async () => {
    renderPage();
    await preSurvey();

    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test$/);
    expect(screen.queryByRole("heading", { name: "Invitation required" })).not.toBeInTheDocument();
  });

  it("starts over with a new link opened in the same tab, and submits with the new token", async () => {
    renderPage();
    await preSurvey();
    click("submit pre-survey");
    await recording();

    click("open another link");

    await waitFor(() => expect(api.validateInvitation).toHaveBeenLastCalledWith("OTHER-TOKEN"));
    await preSurvey();
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/test$/);
    click("submit pre-survey");
    await recording();
    expect(api.submitQuestionnaire).toHaveBeenLastCalledWith("OTHER-TOKEN", { preSurvey: answers.pre });
  });

  it("never renders the token or writes it to storage, through the whole test", async () => {
    await reachPostSurvey();
    click("submit post-survey");
    await screen.findByRole("heading", { name: "Thank you!" });

    expect(document.body.textContent).not.toContain(TOKEN);
    expect(JSON.stringify({ ...localStorage })).not.toContain(TOKEN);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(TOKEN);
  });
});

describe("the test", () => {
  it("sends the pre-survey with the token, then moves on to the recording", async () => {
    renderPage();
    await preSurvey();

    click("submit pre-survey");

    await recording();
    expect(api.submitQuestionnaire).toHaveBeenCalledTimes(1);
    expect(api.submitQuestionnaire).toHaveBeenCalledWith(TOKEN, { preSurvey: answers.pre });
  });

  it("does not send anything for the recording step", async () => {
    renderPage();
    await preSurvey();
    click("submit pre-survey");
    await recording();

    click("finish recording");

    await postSurvey();
    expect(api.submitQuestionnaire).toHaveBeenCalledTimes(1);
  });

  it("sends both surveys with the post-survey, then thanks the respondent", async () => {
    await reachPostSurvey();

    click("submit post-survey");

    expect(await screen.findByRole("heading", { name: "Thank you!" })).toBeInTheDocument();
    expect(api.submitQuestionnaire).toHaveBeenCalledTimes(2);
    expect(api.submitQuestionnaire).toHaveBeenLastCalledWith(TOKEN, {
      preSurvey: answers.pre,
      postSurvey: answers.post,
    });
    expect(screen.queryByRole("heading", { name: "Post-survey step" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays on the pre-survey when it could not be sent, and goes on after a second attempt", async () => {
    api.submitQuestionnaire.mockRejectedValueOnce(new RespondentApiError("not_ready", 501));
    renderPage();
    await preSurvey();

    click("submit pre-survey");

    expect(await screen.findByRole("alert")).toHaveTextContent("The test service isn't available yet.");
    expect(screen.getByRole("alert")).toHaveTextContent("Your answers were not sent.");
    expect(screen.getByRole("heading", { name: "Pre-survey step" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recording step" })).not.toBeInTheDocument();

    click("submit pre-survey");

    await recording();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(api.submitQuestionnaire).toHaveBeenCalledTimes(2);
  });

  it("stays on the post-survey when it could not be sent, and sends everything again on the second attempt", async () => {
    await reachPostSurvey();
    api.submitQuestionnaire.mockRejectedValueOnce(new RespondentApiError("validation", 400));

    click("submit post-survey");

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be accepted");
    expect(screen.queryByRole("heading", { name: "Thank you!" })).not.toBeInTheDocument();

    click("submit post-survey");

    expect(await screen.findByRole("heading", { name: "Thank you!" })).toBeInTheDocument();
    expect(api.submitQuestionnaire).toHaveBeenLastCalledWith(TOKEN, {
      preSurvey: answers.pre,
      postSurvey: answers.post,
    });
  });

  it("does not show the server's message or the token when sending fails", async () => {
    api.submitQuestionnaire.mockRejectedValue(new RespondentApiError("unexpected", 500));
    renderPage();
    await preSurvey();

    click("submit pre-survey");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unexpected response from the server.");
    expect(document.body.textContent).not.toContain(TOKEN);
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

    await preSurvey();
    await waitFor(() => expect(api.validateInvitation).toHaveBeenCalledTimes(2));
  });

  it("falls back to a generic message for an unknown error", async () => {
    api.validateInvitation.mockRejectedValue(new Error("boom"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
