import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/components/auth/auth-context";
import type { Session } from "@/lib/auth";
import { authValue, fakeSession } from "@/test/auth-fixtures";
import Login from "./Login";

const Destination = () => {
  const location = useLocation();
  return <div>arrived at {location.pathname + location.search}</div>;
};

const cameFromAdmin = { pathname: "/login", state: { from: { pathname: "/admin/users", search: "?page=2" } } };

const renderLogin = (value: AuthContextValue, entry: string | typeof cameFromAdmin = cameFromAdmin) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const fillAndSubmit = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
};

describe("Login", () => {
  it("validates the fields without calling signIn", async () => {
    const value = authValue();
    renderLogin(value);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();

    fillAndSubmit("not-an-email", "pw");
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(value.signIn).not.toHaveBeenCalled();
  });

  it("submits the trimmed email and shows a generic error for bad credentials", async () => {
    const value = authValue({ signIn: vi.fn().mockResolvedValue("invalid_credentials") });
    renderLogin(value);

    fillAndSubmit("  admin@example.com ", "wrong");

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(value.signIn).toHaveBeenCalledWith("admin@example.com", "wrong");
    expect(screen.queryByText(/arrived at/)).not.toBeInTheDocument();
  });

  it("shows a rate-limit message", async () => {
    renderLogin(authValue({ signIn: vi.fn().mockResolvedValue("rate_limited") }));

    fillAndSubmit("admin@example.com", "pw");

    expect(await screen.findByText(/Too many attempts/)).toBeInTheDocument();
  });

  it("sends the user to the page they originally requested once the session arrives", async () => {
    const SignedOutThenIn = () => {
      const [session, setSession] = useState<Session | null>(null);
      const signIn = async () => {
        setSession(fakeSession);
        return null;
      };
      return (
        <AuthContext.Provider value={authValue({ session, user: session?.user ?? null, signIn })}>
          <MemoryRouter initialEntries={[cameFromAdmin]}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/*" element={<Destination />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    };
    render(<SignedOutThenIn />);

    fillAndSubmit("admin@example.com", "pw");

    expect(await screen.findByText("arrived at /admin/users?page=2")).toBeInTheDocument();
  });

  it("defaults to /admin when there is no remembered page", async () => {
    renderLogin(authValue({ session: fakeSession, user: fakeSession.user }), "/login");

    expect(await screen.findByText("arrived at /admin")).toBeInTheDocument();
  });

  it("does not show the form while the session is loading", () => {
    renderLogin(authValue({ loading: true }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("explains when authentication is not configured", async () => {
    renderLogin(authValue({ configured: false }));

    expect(screen.getByText("Authentication is not configured for this build.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText("Email")).not.toBeInTheDocument());
  });
});
