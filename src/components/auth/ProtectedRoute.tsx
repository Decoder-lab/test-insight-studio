import { Navigate, Outlet, useLocation } from "react-router-dom";
import FullPageSpinner from "@/components/FullPageSpinner";
import { useAuth } from "@/hooks/use-auth";

/** Layout route: renders nested routes only for a signed-in user. */
const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export default ProtectedRoute;
