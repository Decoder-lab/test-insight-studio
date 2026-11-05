import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordedVideos } from "@/lib/recording/types";
import { respondentApi } from "./client";
import { isRespondentApiError } from "./errors";
import type { QuestionnaireAnswers, RespondentProject } from "./types";

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

/**
 * Submits the questionnaire answers for the invitation held by the caller.
 *
 * Like `useInvitationProject` this is deliberately not react-query: a mutation would keep the token
 * in the mutation cache. `submit` never rejects, so it can be awaited from a form's submit handler;
 * it reports failure through its return value and `error`, which is cleared by the next attempt.
 */
export function useSubmitQuestionnaire(token: string) {
  const [error, setError] = useState<unknown>(null);

  const submit = useCallback(
    async (answers: QuestionnaireAnswers): Promise<boolean> => {
      setError(null);
      try {
        await respondentApi.submitQuestionnaire(token, answers);
        return true;
      } catch (caught) {
        setError(caught);
        return false;
      }
    },
    [token],
  );

  return { submit, error };
}

/** A 4xx answer that is about the request itself, as opposed to a rate limit or a lost connection. */
const rejectedByBackend = (error: unknown) =>
  isRespondentApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429;

/**
 * Uploads the recordings of one take for the invitation held by the caller: for each kind it asks
 * for an upload URL, sends the file straight to Storage, then has the backend verify it.
 *
 * Not react-query, for the same reason as above. `upload` never rejects; it reports failure through
 * its return value and `error`, which is cleared by the next attempt. Calling it again with the same
 * recordings continues where the last attempt stopped: a file that is already in Storage is only
 * verified again (a new upload URL would answer `409` once it is verified) unless the backend
 * rejected it, and a verified one is skipped. The upload URL and its token never leave this function.
 */
export function useRecordingUpload(token: string) {
  const [error, setError] = useState<unknown>(null);
  // Keyed by Blob, so a new take is never mistaken for an uploaded one.
  const inStorage = useRef(new WeakSet<Blob>());
  const verified = useRef(new WeakSet<Blob>());

  const upload = useCallback(
    async (videos: RecordedVideos): Promise<boolean> => {
      setError(null);
      try {
        for (const video of Object.values(videos)) {
          if (!video || verified.current.has(video.blob)) continue;

          if (!inStorage.current.has(video.blob)) {
            const target = await respondentApi.createUploadUrl(token, video.kind, video.contentType);
            await respondentApi.uploadRecording(target, video.blob, video.contentType);
            inStorage.current.add(video.blob);
          }
          try {
            await respondentApi.verifyRecording(token, video.kind, video.durationMs);
          } catch (caught) {
            // The backend looked and rejected what is in Storage (missing, wrong size or type), so
            // verifying the same file again cannot help: the next attempt uploads it again.
            if (rejectedByBackend(caught)) inStorage.current.delete(video.blob);
            throw caught;
          }
          verified.current.add(video.blob);
        }
        return true;
      } catch (caught) {
        setError(caught);
        return false;
      }
    },
    [token],
  );

  return { upload, error };
}

/**
 * Completes the project for the invitation held by the caller (moves it to READY). Idempotent.
 * Same shape as `useSubmitQuestionnaire`: `complete` never rejects.
 */
export function useCompleteProject(token: string) {
  const [error, setError] = useState<unknown>(null);

  const complete = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      await respondentApi.completeProject(token);
      return true;
    } catch (caught) {
      setError(caught);
      return false;
    }
  }, [token]);

  return { complete, error };
}
