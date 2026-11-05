import type { RecordingContentType, RecordingLimits } from "@/lib/respondent-api/types";

/** Best first. Chrome, Edge and Firefox take WebM; Safari only records MP4. */
const CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
] as const;

export interface RecorderFormat {
  /** For `MediaRecorder`, possibly with codec parameters. */
  mimeType: string;
  /** For the upload and the Blob: without parameters, so the bucket's MIME allow-list matches. */
  contentType: RecordingContentType;
}

/**
 * Picks the best format this browser can record and the project accepts.
 * @param allowed The project's `allowedContentTypes`.
 * @returns The format, or null if the browser can record none of the allowed types.
 */
export function pickRecorderFormat(allowed: readonly RecordingContentType[]): RecorderFormat | null {
  if (typeof MediaRecorder === "undefined") return null;

  for (const mimeType of CANDIDATES) {
    const contentType = mimeType.split(";")[0] as RecordingContentType;
    if (allowed.includes(contentType) && MediaRecorder.isTypeSupported(mimeType)) return { mimeType, contentType };
  }
  return null;
}

const AUDIO_BITS_PER_SECOND = 64_000;
const MAX_VIDEO_BITS_PER_SECOND = 1_000_000;
const MIN_VIDEO_BITS_PER_SECOND = 100_000;
/** Encoders overshoot their target bitrate, so only part of the size limit is planned for. */
const SIZE_BUDGET = 0.6;

/**
 * Bitrates that keep a recording of the maximum duration well under the size limit.
 * About 16 MB for 120 s at the 50 MiB limit.
 * @param limits The project's recording limits.
 * @returns Bitrates for `MediaRecorder`.
 */
export function recorderBitrates({
  maxSizeBytes,
  maxDurationSeconds,
}: Pick<RecordingLimits, "maxSizeBytes" | "maxDurationSeconds">) {
  const budget = Math.floor((maxSizeBytes * 8 * SIZE_BUDGET) / maxDurationSeconds);
  return {
    audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    videoBitsPerSecond: Math.max(
      MIN_VIDEO_BITS_PER_SECOND,
      Math.min(MAX_VIDEO_BITS_PER_SECOND, budget - AUDIO_BITS_PER_SECOND),
    ),
  };
}
