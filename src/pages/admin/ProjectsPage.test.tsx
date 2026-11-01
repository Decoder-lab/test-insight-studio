import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "@/lib/admin-api/errors";
import { invitation, project } from "@/test/admin-fixtures";
import ProjectsPage from "./ProjectsPage";

const api = vi.hoisted(() => ({ listProjects: vi.fn() }));
vi.mock("@/lib/admin-api/client", () => ({ adminApi: api }));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => vi.resetAllMocks());

describe("ProjectsPage", () => {
  it("lists projects with their status and the active invitation's status and expiry", async () => {
    api.listProjects.mockResolvedValue({
      items: [
        project({ id: "a", name: "Alpha", status: "IN_PROGRESS", activeInvitation: invitation({ status: "started" }) }),
        project({ id: "b", name: "Beta", status: "CREATED", activeInvitation: null }),
      ],
      nextCursor: null,
    });
    renderPage();

    expect(await screen.findByRole("link", { name: "Alpha" })).toHaveAttribute("href", "/admin/projects/a");
    // Each row renders a stacked layout for narrow screens and table cells for wide ones; CSS shows one of them.
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Started").length).toBeGreaterThan(0);
    expect(screen.getByText(/^Expires /)).toBeInTheDocument();
    expect(screen.getByText(/Link expires /)).toBeInTheDocument();
    expect(screen.getAllByText("No link").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("loads the next page with the cursor and appends it", async () => {
    api.listProjects
      .mockResolvedValueOnce({ items: [project({ id: "a", name: "Alpha" })], nextCursor: "cursor-1" })
      .mockResolvedValueOnce({ items: [project({ id: "b", name: "Beta" })], nextCursor: null });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("link", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
    expect(api.listProjects).toHaveBeenNthCalledWith(1, { status: undefined, cursor: undefined });
    expect(api.listProjects).toHaveBeenNthCalledWith(2, { status: undefined, cursor: "cursor-1" });
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("keeps the loaded rows and offers a retry when the next page fails", async () => {
    api.listProjects
      .mockResolvedValueOnce({ items: [project({ id: "a", name: "Alpha" })], nextCursor: "cursor-1" })
      .mockRejectedValueOnce(new AdminApiError("network", 0));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Could not reach the server.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
  });

  it("explains an empty list", async () => {
    api.listProjects.mockResolvedValue({ items: [], nextCursor: null });
    renderPage();

    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new test/i })).toHaveAttribute("href", "/admin/projects/new");
  });

  it("shows a backend-not-ready state with a working retry", async () => {
    api.listProjects.mockRejectedValueOnce(new AdminApiError("not_ready", 501, "not_implemented"));
    api.listProjects.mockResolvedValueOnce({ items: [project({ name: "Alpha" })], nextCursor: null });
    renderPage();

    expect(await screen.findByText("Backend not ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("link", { name: "Alpha" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Backend not ready")).not.toBeInTheDocument());
  });

  it("tells a non-administrator why there is nothing to see, without a retry", async () => {
    api.listProjects.mockRejectedValue(new AdminApiError("forbidden", 403, "forbidden"));
    renderPage();

    expect(await screen.findByText("Your account is not an administrator.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
