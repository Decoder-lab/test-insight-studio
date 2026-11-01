import { useCallback, useEffect, useState } from "react";
import { respondentApi } from "./client";
import type { RespondentProject } from "./types";

export type InvitationProjectState =
  | { status: "loading" }
  | { status: "ready"; project: RespondentProject }
  | { status: "error"; error: unknown };

/**
 * Validates the invitation token and loads the project the respondent may see.
 *
 * Deliberately not react-query: the token is a password, and it must not become part of a query
 * key or sit in a cache. It lives only in the caller's memory and in the request header.
 */
export function useInvitationProject(token: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<InvitationProjectState>({ status: "loading" });

  useEffect(() => {
    if (!token) return;
    // Ignore a stale response: a retry, a different token or an unmount (StrictMode runs effects twice).
    let ignore = false;
    setResult({ status: "loading" });
    respondentApi.validateInvitation(token).then(
      (project) => !ignore && setResult({ status: "ready", project }),
      (error: unknown) => !ignore && setResult({ status: "error", error }),
    );
    return () => {
      ignore = true;
    };
  }, [token, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...result, retry };
}
