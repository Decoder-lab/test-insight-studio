import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/components/auth/auth-context";
import { authValue, fakeSession } from "@/test/auth-fixtures";
import Logout from "./Logout";

const renderLogout = (value: AuthContextValue) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/logout"]}>
        <Routes>
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("Logout", () => {
  it("signs out once and lands on /login", async () => {
    const value = authValue({ session: fakeSession, user: fakeSession.user });
    renderLogout(value);

    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(value.signOut).toHaveBeenCalledTimes(1);
  });

  it("still lands on /login when sign-out rejects", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("offline"));
    renderLogout(authValue({ session: fakeSession, user: fakeSession.user, signOut }));

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});
