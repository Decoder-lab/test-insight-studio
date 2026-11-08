import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";
import { field, invitation, playback, projectDetails, questionnaireResponse, renderAdminRoute } from "@/test/admin-fixtures";
import ProjectDetailsPage from "./ProjectDetailsPage";

const api = vi.hoisted(() => ({
  getProject: vi.fn(),
  listProjectFields: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  getQuestionnaireResponse: vi.fn(),
  getRecordingPlayback: vi.fn(),
}));
vi.mock("@/lib/admin-api/client", () => ({ adminApi: api }));

const TOKEN = "NEW-SECRET-TOKEN";
const PATH = "/admin/projects/:projectId";

const renderPage = (entry: string | object = "/admin/projects/p1") =>
  renderAdminRoute(<ProjectDetailsPage />, PATH, entry);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  api.listProjectFields.mockResolvedValue({ items: [] });
  api.getProject.mockResolvedValue(projectDetails());
  api.createInvitation.mockResolvedValue({ invitation: invitation({ id: "inv-new" }), token: TOKEN });
  api.getQuestionnaireResponse.mockRejectedValue(new AdminApiError("api", 404, "not_found", "x"));
  api.getRecordingPlayback.mockResolvedValue(playback());
});

describe("project data", () => {
  it("labels field values with their definition and falls back to the raw key", async () => {
    api.listProjectFields.mockResolvedValue({ items: [field({ key: "title", label: "Project title", fieldType: "text" })] });
    api.getProject.mockResolvedValue(projectDetails({ fields: { title: "Hello", archived_key: 7, agreed: true } }));
    renderPage();

    expect(await screen.findByText("Project title")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("archived_key")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("agreed")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows the target URL and lets the administrator check it again", async () => {
    api.getProject.mockResolvedValue(projectDetails({ targetUrl: "https://shop.example.org/start" }));
    renderPage();

    expect(await screen.findByText("Target URL")).toBeInTheDocument();
    expect(screen.getByText("https://shop.example.org/start")).toBeInTheDocument();
    expect(screen.queryByTitle("Target page preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    const dialog = await screen.findByRole("dialog", { name: "Check the target page" });
    expect(within(dialog).getByTitle("Target page preview")).toHaveAttribute("src", "https://shop.example.org/start");

    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("still shows the project, with raw keys, when the definitions cannot be loaded", async () => {
    api.listProjectFields.mockRejectedValue(new AdminApiError("not_ready", 501));
    api.getProject.mockResolvedValue(projectDetails({ fields: { title: "Hello" } }));
    renderPage();

    expect(await screen.findByText("title")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("shows the questionnaire and recording progress", async () => {
    api.getProject.mockResolvedValue(
      projectDetails({ questionnaireSubmitted: true, recordings: { camera: "VERIFIED", screen: "UPLOAD_REQUESTED" } }),
    );
    renderPage();

    expect(await screen.findByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Upload requested")).toBeInTheDocument();
  });

  it("says so when the project does not exist, without offering a retry", async () => {
    api.getProject.mockRejectedValue(new AdminApiError("api", 404, "not_found", "x"));
    renderPage();

    expect(await screen.findByText("This project does not exist.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("explains that a non-administrator has no access", async () => {
    api.getProject.mockRejectedValue(new AdminApiError("forbidden", 403));
    renderPage();

    expect(await screen.findByText("Your account is not an administrator.")).toBeInTheDocument();
  });
});

describe("invitations", () => {
  it("shows each invitation's state in plain words, newest first", async () => {
    api.getProject.mockResolvedValue(
      projectDetails({
        invitations: [
          invitation({ id: "old", status: "expired", createdAt: "2026-10-01T10:00:00.000Z" }),
          invitation({ id: "new", status: "started", startedAt: "2026-11-02T10:00:00.000Z", createdAt: "2026-11-01T10:00:00.000Z" }),
        ],
      }),
    );
    renderPage();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Started", { selector: "div" })).toBeInTheDocument();
    expect(within(items[0]).getByText("Link no longer opens")).toBeInTheDocument();
    expect(within(items[1]).getByText("Expired", { selector: "div" })).toBeInTheDocument();
  });

  it("offers Revoke only for invitations that are not revoked, and updates from the response", async () => {
    api.getProject.mockResolvedValue(
      projectDetails({
        invitations: [
          invitation({ id: "live", status: "active", createdAt: "2026-11-02T10:00:00.000Z" }),
          invitation({ id: "gone", status: "revoked", revokedAt: "2026-11-01T12:00:00.000Z" }),
        ],
      }),
    );
    api.revokeInvitation.mockResolvedValue(invitation({ id: "live", status: "revoked", revokedAt: "2026-11-02T11:00:00.000Z" }));
    renderPage();

    const revokeButtons = await screen.findAllByRole("button", { name: "Revoke link" });
    expect(revokeButtons).toHaveLength(1);

    fireEvent.click(revokeButtons[0]);
    expect(api.revokeInvitation).not.toHaveBeenCalled(); // asks first
    const confirm = await screen.findByRole("alertdialog");
    fireEvent.click(within(confirm).getByRole("button", { name: "Revoke link" }));

    await waitFor(() => expect(api.revokeInvitation).toHaveBeenCalledWith("p1", "live"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Revoke link" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Revoked", { selector: "div" })).toHaveLength(2); // the badges
  });

  it("creates the first link after choosing an expiry and shows it once", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Create link" }));
    const form = await screen.findByRole("dialog");
    expect(within(form).queryByText(/disable the current link/i)).not.toBeInTheDocument();
    fireEvent.click(within(form).getByRole("radio", { name: "30 days" }));
    fireEvent.click(within(form).getByRole("button", { name: "Create link" }));

    await waitFor(() => expect(api.createInvitation).toHaveBeenCalledWith("p1", { expiresInHours: 720 }));
    const linkDialog = await screen.findByRole("dialog", { name: "Invitation link" });
    expect((within(linkDialog).getByRole("textbox", { name: "Link" }) as HTMLInputElement).value).toBe(
      `${window.location.origin}/test#invite=${TOKEN}`,
    );

    fireEvent.click(within(linkDialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.textContent).not.toContain(TOKEN);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("asks for confirmation before renewing, because it disables the current link", async () => {
    api.getProject.mockResolvedValue(projectDetails({ invitations: [invitation({ status: "active" })] }));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Renew link" }));
    const confirm = await screen.findByRole("dialog");

    expect(within(confirm).getByText(/This will disable the current link/)).toBeInTheDocument();
    expect(api.createInvitation).not.toHaveBeenCalled();

    fireEvent.click(within(confirm).getByRole("button", { name: "Renew link" }));
    await waitFor(() => expect(api.createInvitation).toHaveBeenCalledWith("p1", { expiresInHours: 168 }));
  });

  it("does not offer a link for a READY project", async () => {
    api.getProject.mockResolvedValue(
      projectDetails({ status: "READY", readyAt: "2026-11-03T10:00:00.000Z", invitations: [invitation({ status: "started" })] }),
    );
    renderPage();

    await screen.findByText("Ready", { selector: "div" });
    expect(screen.queryByRole("button", { name: /create link|renew link/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no new link can be created/i)).toBeInTheDocument();
  });

  it("reports a conflict inside the dialog and keeps it open", async () => {
    api.createInvitation.mockRejectedValue(new AdminApiError("api", 409, "conflict", "x"));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Create link" }));
    const form = await screen.findByRole("dialog");
    fireEvent.click(within(form).getByRole("button", { name: "Create link" }));

    expect(await within(form).findByText(/already complete/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Invitation link" })).not.toBeInTheDocument();
  });

  it("points to Create link when the project was created without one", async () => {
    renderPage({ pathname: "/admin/projects/p1", state: { linkFailed: true } });

    expect(await screen.findByText(/its link could not be created/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create link" })).toBeInTheDocument();
  });
});

const READY = { status: "READY", readyAt: "2026-11-03T10:00:00.000Z" } as const;
const camera = () => screen.findByLabelText("Camera recording", { selector: "video" });

describe("questionnaire answers", () => {
  it("shows the stored answers under the questions the respondent saw", async () => {
    api.getProject.mockResolvedValue(projectDetails({ ...READY, questionnaireSubmitted: true }));
    api.getQuestionnaireResponse.mockResolvedValue(questionnaireResponse());
    renderPage();

    expect(await screen.findByText("What problem are you trying to solve?")).toBeInTheDocument();
    expect(screen.getByText("Interview notes get lost")).toBeInTheDocument();
    expect(screen.getByText("€1-5K")).toBeInTheDocument();
    expect(screen.getByText("4 / 5")).toBeInTheDocument();
    expect(screen.getByText("How would you feel if you could no longer use this product?")).toBeInTheDocument();
    expect(screen.getByText("Very disappointed")).toBeInTheDocument();
    expect(screen.getByText("Export to other tools")).toBeInTheDocument();
    expect(screen.getByText(/Last saved 3 Nov 2026/)).toBeInTheDocument();
    expect(api.getQuestionnaireResponse).toHaveBeenCalledWith("p1");
  });

  it("says the post-survey is missing when only the pre-survey is stored", async () => {
    api.getProject.mockResolvedValue(projectDetails({ status: "IN_PROGRESS" }));
    const { answers, submittedAt } = questionnaireResponse();
    api.getQuestionnaireResponse.mockResolvedValue({ answers: { preSurvey: answers.preSurvey }, submittedAt });
    renderPage();

    expect(await screen.findByText("Interview notes get lost")).toBeInTheDocument();
    expect(screen.getByText("The post-survey has not been submitted yet.")).toBeInTheDocument();
  });

  it("treats not_found as nothing submitted yet, not as an error", async () => {
    api.getProject.mockResolvedValue(projectDetails({ status: "IN_PROGRESS" }));
    renderPage();

    expect(await screen.findByText("No answers submitted yet.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not ask for answers before anything can have been submitted", async () => {
    renderPage();

    expect(await screen.findByText("No answers submitted yet.")).toBeInTheDocument();
    expect(api.getQuestionnaireResponse).not.toHaveBeenCalled();
  });

  it("shows a retry for other failures", async () => {
    api.getProject.mockResolvedValue(projectDetails(READY));
    api.getQuestionnaireResponse.mockRejectedValueOnce(new AdminApiError("network", 0));
    api.getQuestionnaireResponse.mockResolvedValue(questionnaireResponse());
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Interview notes get lost")).toBeInTheDocument();
    expect(api.getQuestionnaireResponse).toHaveBeenCalledTimes(2);
  });

  it("renders free-text answers as text, never as markup", async () => {
    api.getProject.mockResolvedValue(projectDetails(READY));
    const stored = questionnaireResponse();
    stored.answers.preSurvey.problemToSolve = "<img src=x onerror=alert(1)> first line\nsecond line";
    api.getQuestionnaireResponse.mockResolvedValue(stored);
    const { container } = renderPage();

    expect(await screen.findByText(/<img src=x onerror=alert\(1\)> first line/)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("recordings", () => {
  it("plays a verified recording with the signed URL and shows its details", async () => {
    api.getProject.mockResolvedValue(projectDetails({ ...READY, recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    renderPage();

    const video = await camera();
    expect(video).toHaveAttribute("src", playback().url);
    expect(video).toHaveAttribute("controls");
    expect(screen.getByText("1:05 · 1.5 MB · video/webm")).toBeInTheDocument();
    expect(api.getRecordingPlayback).toHaveBeenCalledTimes(1);
    expect(api.getRecordingPlayback).toHaveBeenCalledWith("p1", "camera");
  });

  it("lists both kinds and only asks for a URL for the verified ones", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "UPLOAD_REQUESTED", screen: "NOT_STARTED" } }));
    renderPage();

    expect(await screen.findByText("Upload requested, not verified yet.")).toBeInTheDocument();
    expect(screen.getByText("No recording yet.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Camera recording" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Screen recording" })).toBeInTheDocument();
    expect(api.getRecordingPlayback).not.toHaveBeenCalled();
  });

  it("shows a player for the screen recording when it is verified too", async () => {
    api.getProject.mockResolvedValue(projectDetails({ ...READY, recordings: { camera: "VERIFIED", screen: "VERIFIED" } }));
    renderPage();

    await waitFor(() => expect(document.querySelectorAll("video")).toHaveLength(2));
    expect(api.getRecordingPlayback.mock.calls).toEqual(expect.arrayContaining([["p1", "camera"], ["p1", "screen"]]));
  });

  it("shows a loading state while the URL is requested", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    api.getRecordingPlayback.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(await screen.findByRole("status", { name: "Loading camera recording" })).toBeInTheDocument();
  });

  it("says when the stored file is gone, without a retry", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    api.getRecordingPlayback.mockRejectedValue(new AdminApiError("api", 404, "not_found", "x"));
    renderPage();

    expect(await screen.findByText("The recording file could not be found.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("offers a retry when the URL cannot be requested", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    api.getRecordingPlayback.mockRejectedValueOnce(new AdminApiError("network", 0));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await camera()).toBeInTheDocument();
    expect(api.getRecordingPlayback).toHaveBeenCalledTimes(2);
  });

  it("asks for a new URL once when playback fails, then offers a retry", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    api.getRecordingPlayback
      .mockResolvedValueOnce(playback({ url: "https://storage.example/first" }))
      .mockResolvedValue(playback({ url: "https://storage.example/second" }));
    renderPage();

    const video = await camera();
    fireEvent.error(video); // e.g. the first URL expired
    await waitFor(() => expect(video).toHaveAttribute("src", "https://storage.example/second"));
    expect(api.getRecordingPlayback).toHaveBeenCalledTimes(2);

    fireEvent.error(video);
    expect(await screen.findByText("This recording could not be played.")).toBeInTheDocument();
    expect(api.getRecordingPlayback).toHaveBeenCalledTimes(2); // no loop

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await camera()).toBeInTheDocument();
    expect(api.getRecordingPlayback).toHaveBeenCalledTimes(3);
  });

  it("keeps the signed URL out of storage and out of the visible text", async () => {
    api.getProject.mockResolvedValue(projectDetails({ recordings: { camera: "VERIFIED", screen: "NOT_STARTED" } }));
    renderPage();

    await camera();
    expect(document.body.textContent).not.toContain("READ-TOKEN");
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
});
