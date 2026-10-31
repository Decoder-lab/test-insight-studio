import { Outlet } from "react-router-dom";
import AuthProvider from "./AuthProvider";

/** Layout route: only the routes nested under it load Supabase and see the auth context. */
const AuthLayout = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

export default AuthLayout;
