import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import type { Session } from "@/lib/auth";
import { fakeSession } from "@/test/auth-fixtures";
import AuthProvider from "./AuthProvider";

const lib = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/auth", () => lib);
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));

const Probe = () => {
  const { loading, user } = useAuth();
  return <div>{loading ? "loading" : `user: ${user?.email ?? "none"}`}</div>;
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe("AuthProvider", () => {
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    lib.onAuthChange.mockReturnValue(unsubscribe);
  });

  it("stays loading until the initial session is read, then exposes it", async () => {
    let resolve!: (session: Session | null) => void;
    lib.getSession.mockReturnValue(new Promise((r) => (resolve = r)));
    renderProvider();

    expect(screen.getByText("loading")).toBeInTheDocument();

    await act(async () => resolve(fakeSession));
    expect(screen.getByText("user: admin@example.com")).toBeInTheDocument();
  });

  it("settles as signed out when no session exists or reading it fails", async () => {
    lib.getSession.mockRejectedValue(new Error("storage unavailable"));
    renderProvider();

    expect(await screen.findByText("user: none")).toBeInTheDocument();
  });

  it("follows later auth changes", async () => {
    lib.getSession.mockResolvedValue(fakeSession);
    renderProvider();
    await screen.findByText("user: admin@example.com");

    const onChange = lib.onAuthChange.mock.calls[0][0] as (session: Session | null) => void;
    act(() => onChange(null));

    expect(screen.getByText("user: none")).toBeInTheDocument();
  });

  it("unsubscribes from auth changes on unmount", async () => {
    lib.getSession.mockResolvedValue(null);
    const { unmount } = renderProvider();
    await screen.findByText("user: none");

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
