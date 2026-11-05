import type { RecordingKind } from "./types";

/**
 * What a test records. The screen recording is implemented and tested end to end (capture, upload,
 * verify) but switched off for now: add "screen" here to turn it on, and make the backend require it
 * (its `complete` step only waits for the kinds it lists as required).
 */
export const ENABLED_RECORDING_KINDS: readonly RecordingKind[] = ["camera"];

/**
 * Kinds without which there is no test. The others are optional: if the respondent declines to
 * share the screen, the test goes on with the camera alone.
 */
export const REQUIRED_RECORDING_KINDS: readonly RecordingKind[] = ["camera"];
