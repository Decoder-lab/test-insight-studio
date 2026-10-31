import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import FullPageSpinner from "@/components/FullPageSpinner";
import { useAuth } from "@/hooks/use-auth";

const Logout = () => {
  const { signOut } = useAuth();
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // supabase-js clears the local session even if revoking it on the server fails (e.g. offline),
    // so there is nothing to retry: always continue to /login.
    void signOut()
      .catch(() => undefined)
      .then(() => setDone(true));
  }, [signOut]);

  return done ? <Navigate to="/login" replace /> : <FullPageSpinner />;
};

export default Logout;
