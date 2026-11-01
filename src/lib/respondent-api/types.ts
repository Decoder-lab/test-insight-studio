// Hand-written from contracts/openapi.yaml (Test Insight Studio Backend API, 0.2.0-draft).
// Keep in sync with the contract; do not add fields that are not in it.

import type { ErrorCode, ProjectStatus, RecordingProgress } from "@/lib/admin-api/types";

export type { ErrorCode, ProjectStatus, RecordingProgress };

export type RecordingContentType = "video/webm" | "video/mp4";

export interface RecordingLimits {
  /** Fixed at 120 by the contract. */
  maxDurationSeconds: number;
  /** 52428800 (50 MiB) on the Supabase Free plan; may change with the storage tier. */
  maxSizeBytes: number;
  allowedContentTypes: RecordingContentType[];
}

/** The only project information a respondent may see. Deliberately minimal. */
export interface RespondentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  limits: RecordingLimits;
  progress: {
    questionnaireSubmitted: boolean;
    recordings: { camera: RecordingProgress; screen: RecordingProgress };
  };
}
