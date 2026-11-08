import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";
import type { ProjectFieldDefinition } from "@/lib/admin-api/types";
import { field, invitation, project, renderAdminRoute } from "@/test/admin-fixtures";
import { TARGET_FRAME_SANDBOX } from "@/components/TargetFrame";
import CreateProjectPage from "./CreateProjectPage";

const api = vi.hoisted(() => ({
  listProjectFields: vi.fn(),
  createProject: vi.fn(),
  createInvitation: vi.fn(),
}));
vi.mock("@/lib/admin-api/client", () => ({ adminApi: api }));

// Deliberately out of position order: the form must sort them.
const ALL_TYPES: ProjectFieldDefinition[] = [
  field({ key: "market", label: "Market", fieldType: "select", options: ["DE", "FR"], position: 6 }),
  field({ key: "title", label: "Title", fieldType: "text", required: true, position: 1 }),
  field({ key: "when", label: "Date", fieldType: "date", position: 5 }),
  field({ key: "notes", label: "Notes", fieldType: "long_text", position: 2 }),
  field({ key: "signed", label: "Signed", fieldType: "boolean", position: 4 }),
  field({ key: "seats", label: "Seats", fieldType: "number", position: 3 }),
];

const TOKEN = "SECRET-TOKEN-123";
const TARGET_URL = "https://example.com/pricing";

const renderPage = () => renderAdminRoute(<CreateProjectPage />, "/admin/projects/new");
const labels = () => Array.from(document.querySelectorAll("label")).map((label) => label.textContent?.replace("(optional)", ""));
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const check = () => fireEvent.click(screen.getByRole("button", { name: "Check" }));
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Create test" }));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  api.listProjectFields.mockResolvedValue({ items: [field({ key: "title", label: "Title", fieldType: "text", required: true })] });
  api.createProject.mockResolvedValue(project({ id: "p1" }));
  api.createInvitation.mockResolvedValue({ invitation: invitation(), token: TOKEN });
});

describe("form from field definitions", () => {
  it("renders one input per definition, by type, ordered by position", async () => {
    api.listProjectFields.mockResolvedValue({ items: ALL_TYPES });
    renderPage();

    await screen.findByLabelText("Name");

    expect(labels()).toEqual(["Name", "Target URL", "Title", "Notes", "Seats", "Signed", "Date", "Market"]);
    expect(screen.getByLabelText("Title")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/^Notes/).tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/^Seats/)).toHaveAttribute("type", "number");
    expect(screen.getByRole("switch", { name: /^Signed/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/)).toHaveAttribute("type", "date");
    expect(screen.getByRole("combobox", { name: /^Market/ })).toBeInTheDocument();
  });

  it("is just the name, the target URL and the link expiry when no fields are defined", async () => {
    api.listProjectFields.mockResolvedValue({ items: [] });
    renderPage();

    await screen.findByLabelText("Name");

    expect(labels()).toEqual(["Name", "Target URL"]);
    expect(screen.getByRole("radio", { name: "7 days" })).toBeChecked();
  });

  it("sends only the filled fields, keyed by the definition's key", async () => {
    api.listProjectFields.mockResolvedValue({ items: ALL_TYPES });
    renderPage();
    await screen.findByLabelText("Name");

    type("Name", "My test");

    type("Target URL", TARGET_URL);
    type("Title", "Hello");
    type(/^Seats/, "12");
    type(/^Date/, "2026-03-09");
    fireEvent.click(screen.getByRole("switch", { name: /^Signed/ }));
    submit();

    await waitFor(() =>
      expect(api.createProject).toHaveBeenCalledWith({
        name: "My test",
        targetUrl: TARGET_URL,
        fields: { title: "Hello", seats: 12, signed: true, when: "2026-03-09" },
      }),
    );
  });

  it("shows a backend-not-ready state instead of the form when the definitions cannot be loaded", async () => {
    api.listProjectFields.mockRejectedValue(new AdminApiError("not_ready", 501, "not_implemented"));
    renderPage();

    expect(await screen.findByText("Backend not ready")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});

describe("validation", () => {
  it("does not call the API for an empty name or a missing required field", async () => {
    renderPage();
    await screen.findByLabelText("Name");

    submit();

    expect(await screen.findByText("Enter a name")).toBeInTheDocument();
    expect(await screen.findByText("Enter the page's address")).toBeInTheDocument();
    expect(await screen.findByText("Required")).toBeInTheDocument();
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("uses the chosen expiry for the link", async () => {
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "N");
    type("Target URL", TARGET_URL);
    type("Title", "T");

    fireEvent.click(screen.getByRole("radio", { name: "24 hours" }));
    submit();
    await waitFor(() => expect(api.createInvitation).toHaveBeenCalledWith("p1", { expiresInHours: 24 }));
  });

  it("accepts a custom number of hours and rejects one outside 1-720", async () => {
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "N");
    type("Target URL", TARGET_URL);
    type("Title", "T");

    fireEvent.click(screen.getByRole("radio", { name: "Custom" }));
    type(/^Hours/, "721");
    submit();
    expect(await screen.findByText(/at most 720/i)).toBeInTheDocument();
    expect(api.createProject).not.toHaveBeenCalled();

    type(/^Hours/, "48");
    submit();
    await waitFor(() => expect(api.createInvitation).toHaveBeenCalledWith("p1", { expiresInHours: 48 }));
  });
});

describe("target URL", () => {
  const fillRest = () => {
    type("Name", "My test");
    type("Title", "Hello");
  };

  it.each([
    ["http://example.com", "Start the address with https://"],
    ["example.com", "Start the address with https://"],
    ["HTTPS://example.com", "Start the address with https://"],
    ["https://user:pw@example.com", "The address must not contain a user name or password"],
  ])("does not create anything for %s", async (value, message) => {
    renderPage();
    await screen.findByLabelText("Name");
    fillRest();
    type("Target URL", value);

    submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("sends the address trimmed", async () => {
    renderPage();
    await screen.findByLabelText("Name");
    fillRest();
    type("Target URL", `  ${TARGET_URL}  `);

    submit();

    await waitFor(() =>
      expect(api.createProject).toHaveBeenCalledWith({ name: "My test", targetUrl: TARGET_URL, fields: { title: "Hello" } }),
    );
  });

  it("shows the address in a large dialog, in the same sandboxed frame the respondent gets, and sends nothing", async () => {
    renderPage();
    await screen.findByLabelText("Name");
    type("Target URL", `  ${TARGET_URL}  `);

    check();

    const dialog = await screen.findByRole("dialog");
    const frame = within(dialog).getByTitle("Target page preview");
    expect(frame).toHaveAttribute("src", TARGET_URL);
    expect(frame).toHaveAttribute("sandbox", TARGET_FRAME_SANDBOX);
    expect(dialog.className).toContain("h-[90vh]");
    expect(api.createProject).not.toHaveBeenCalled();
    expect(api.createInvitation).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByTitle("Target page preview")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Target URL")).toHaveValue(TARGET_URL); // what was typed is still there
  });

  it.each([
    ["", "Enter the page's address"],
    ["http://example.com", "Start the address with https://"],
  ])("explains what is wrong instead of opening the dialog for %j", async (value, message) => {
    renderPage();
    await screen.findByLabelText("Name");
    type("Target URL", value);

    check();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Target page preview")).not.toBeInTheDocument();
  });
});

describe("two-call submit", () => {
  it("keeps the project and goes to its details page when the link cannot be created", async () => {
    api.createInvitation.mockRejectedValue(new AdminApiError("network", 0));
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "My test");
    type("Target URL", TARGET_URL);
    type("Title", "Hello");

    submit();

    expect(await screen.findByText("details of p1 (link failed)")).toBeInTheDocument();
    expect(api.createProject).toHaveBeenCalledTimes(1);
    expect(api.createProject).toHaveBeenCalledWith({ name: "My test", targetUrl: TARGET_URL, fields: { title: "Hello" } });
    expect(api.createInvitation).toHaveBeenCalledWith("p1", { expiresInHours: 168 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the link once, clears it on close and then goes to the details page", async () => {
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "My test");
    type("Target URL", TARGET_URL);
    type("Title", "Hello");

    submit();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/will not be able to see this link again/i)).toBeInTheDocument();
    const link = within(dialog).getByRole("textbox", { name: "Link" }) as HTMLInputElement;
    expect(link.value).toBe(`${window.location.origin}/test#invite=${TOKEN}`);
    expect(new URL(link.value).search).toBe("");

    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));

    expect(await screen.findByText("details of p1")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(TOKEN);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("keeps what was typed and shows the server's message when the project is rejected", async () => {
    api.createProject.mockRejectedValue(new AdminApiError("api", 400, "validation_error", "fields.title: must be text"));
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "My test");
    type("Target URL", TARGET_URL);
    type("Title", "Hello");

    submit();

    expect(await screen.findByText("fields.title: must be text")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("My test");
    expect(screen.getByLabelText("Title")).toHaveValue("Hello");
    expect(api.createInvitation).not.toHaveBeenCalled();
  });

  it("offers a retry when the server cannot be reached and creates nothing twice", async () => {
    api.createProject.mockRejectedValueOnce(new AdminApiError("network", 0));
    renderPage();
    await screen.findByLabelText("Name");
    type("Name", "My test");
    type("Target URL", TARGET_URL);
    type("Title", "Hello");

    submit();
    expect(await screen.findByText("Could not reach the server.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(api.createProject).toHaveBeenCalledTimes(2);
    expect(api.createInvitation).toHaveBeenCalledTimes(1);
  });
});
