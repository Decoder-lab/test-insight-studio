import type { RecordingContentType, RecordingKind } from "@/lib/respondent-api/types";

export type { RecordingKind };

/** One finished recording, ready to be uploaded. */
export interface RecordedVideo {
  kind: RecordingKind;
  /** Its type is the bare MIME type (`video/webm`), never one with codec parameters. */
  blob: Blob;
  contentType: RecordingContentType;
  /** Measured in the browser: an integer from 1 to the project's maximum duration in milliseconds. */
  durationMs: number;
}

/** The recordings of one take. A kind that was not captured is absent. */
export type RecordedVideos = Partial<Record<RecordingKind, RecordedVideo>>;
