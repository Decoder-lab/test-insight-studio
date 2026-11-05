import type { RecordingKind } from "./types";

/**
 * Asks the browser for the media of one recording kind. The browser prompts the respondent, so
 * this rejects with the browser's own error (`NotAllowedError`, `NotFoundError`, ...) when
 * permission is denied or no device exists.
 * @param kind Which recording to capture.
 * @returns The stream: video with audio for the camera, video only for the screen.
 */
export function captureStream(kind: RecordingKind): Promise<MediaStream> {
  if (kind === "camera") {
    return navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: true,
    });
  }

  // `displaySurface` is a valid hint that the DOM typings do not know yet.
  const video: MediaTrackConstraints & { displaySurface: string } = { displaySurface: "browser" };
  return navigator.mediaDevices.getDisplayMedia({ video, audio: false });
}
