import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";
import { field, invitation, projectDetails, renderAdminRoute } from "@/test/admin-fixtures";
import ProjectDetailsPage from "./ProjectDetailsPage";

const api = vi.hoisted(() => ({
  getProject: vi.fn(),
  listProjectFields: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
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
