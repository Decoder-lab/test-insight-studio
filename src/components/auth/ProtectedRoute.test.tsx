import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { authValue, fakeSession } from "@/test/auth-fixtures";
import { AuthContext, type AuthContextValue } from "./auth-context";
import ProtectedRoute from "./ProtectedRoute";

const LoginProbe = () => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  return <div>login page, from {from ? from.pathname + from.search : "nowhere"}</div>;
};

const renderAdmin = (value: AuthContextValue) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/admin/users?page=2"]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/*" element={<div>secret admin content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("ProtectedRoute", () => {
  it("shows neither content nor a redirect while the session is loading", () => {
    renderAdmin(authValue({ loading: true }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("secret admin content")).not.toBeInTheDocument();
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
  });

  it("redirects signed-out visitors to /login and remembers where they were going", () => {
    renderAdmin(authValue());

    expect(screen.getByText("login page, from /admin/users?page=2")).toBeInTheDocument();
    expect(screen.queryByText("secret admin content")).not.toBeInTheDocument();
  });

  it("renders the nested route for a signed-in user", () => {
    renderAdmin(authValue({ session: fakeSession, user: fakeSession.user }));

    expect(screen.getByText("secret admin content")).toBeInTheDocument();
  });
});
