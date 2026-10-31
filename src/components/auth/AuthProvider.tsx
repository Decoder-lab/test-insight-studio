import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getSession, onAuthChange, signInWithPassword, signOut, type Session } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AuthContext, type AuthContextValue } from "./auth-context";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;
    // Only set state here; calling other Supabase methods inside this callback can deadlock.
    const unsubscribe = onAuthChange((next) => {
      if (active) setSession(next);
    });
    getSession()
      .catch(() => null)
      .then((initial) => {
        if (!active) return;
        setSession(initial);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: isSupabaseConfigured,
      signIn: signInWithPassword,
      signOut,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
