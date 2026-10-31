import { createContext } from "react";
import type { Session, SignInError, User } from "@/lib/auth";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the initial session has been read. */
  loading: boolean;
  /** False when the VITE_SUPABASE_* variables are missing from the build. */
  configured: boolean;
  /** Resolves to null on success, otherwise a category of failure. */
  signIn: (email: string, password: string) => Promise<SignInError | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
