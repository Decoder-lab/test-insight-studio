import { useCallback, useEffect, useRef, useState } from "react";
import { REQUIRED_RECORDING_KINDS } from "@/lib/recording/config";
import { pickRecorderFormat, recorderBitrates, type RecorderFormat } from "@/lib/recording/format";
import { captureStream } from "@/lib/recording/sources";
import type { RecordedVideos, RecordingKind } from "@/lib/recording/types";
import type { RecordingLimits } from "@/lib/respondent-api/types";

export type RecordingStatus = "idle" | "starting" | "recording";

interface Capture {
  kind: RecordingKind;
  stream: MediaStream;
  recorder: MediaRecorder;
  chunks: Blob[];
  startedAt: number;
  endedAt: number;
  /** Settles when the recorder has delivered its last chunk. */
  stopped: Promise<void>;
}

/** One run from "Start" to the last recorder stopping. */
interface Take {
  captures: Capture[];
  format: RecorderFormat;
  startedAt: number;
  ticker?: ReturnType<typeof setInterval>;
  limitTimer?: ReturnType<typeof setTimeout>;
  stopping: boolean;
  /** The respondent left; the take is thrown away. */
  disposed: boolean;
}

interface Options {
  kinds: readonly RecordingKind[];
  limits: RecordingLimits;
  /** Called once with whatever was recorded after `stop` (or the time limit, or a device ending). */
  onFinished: (videos: RecordedVideos) => void;
}

const UNSUPPORTED = "Your browser can't record video. Please use a recent version of Chrome, Edge, Firefox or Safari.";

function describeCaptureError(error: unknown): string {
  const { name, message } = (error ?? {}) as { name?: string; message?: string };
  if (name === "NotAllowedError") return "Camera/microphone permission denied. Please allow access and try again.";
  if (name === "NotFoundError") return "No camera or microphone found. Please connect a device and try again.";
  return `Could not start recording: ${message ?? "unknown error"}`;
}

const stopTracks = (streams: Iterable<MediaStream>) => {
  for (const stream of streams) stream.getTracks().forEach((track) => track.stop());
};

/**
 * Records the enabled kinds (camera with microphone, optionally the screen) in the browser, one
 * `MediaRecorder` per kind. The recording ends on `stop`, at the project's maximum duration, or when
 * a device ends (camera unplugged, screen sharing stopped). Every media track is released when the
 * take ends and when the component unmounts. Nothing is sent anywhere.
 */
export function useRecordingSession({ kinds, limits, onFinished }: Options) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const takeRef = useRef<Take | null>(null);
  const mountedRef = useRef(true);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  /** Shows the camera in the preview as soon as the `<video>` exists, which is after recording starts. */
  const setPreview = useCallback((element: HTMLVideoElement | null) => {
    previewRef.current = element;
    if (element) element.srcObject = cameraStreamRef.current;
  }, []);

  const release = useCallback((take: Take) => {
    clearInterval(take.ticker);
    clearTimeout(take.limitTimer);
    stopTracks(take.captures.map((capture) => capture.stream));
    cameraStreamRef.current = null;
    if (previewRef.current) previewRef.current.srcObject = null;
  }, []);

  const finish = useCallback(
    (take: Take) => {
      release(take);
      if (take.disposed) return;

      const maxMs = limits.maxDurationSeconds * 1000;
      const videos: RecordedVideos = {};
      for (const { kind, chunks, startedAt, endedAt } of take.captures) {
        if (chunks.length === 0) continue;
        videos[kind] = {
          kind,
          // The bare type: the bucket only accepts `video/webm` / `video/mp4`, not codec parameters.
          blob: new Blob(chunks, { type: take.format.contentType }),
          contentType: take.format.contentType,
          durationMs: Math.min(maxMs, Math.max(1, Math.round(endedAt - startedAt))),
        };
      }
      takeRef.current = null;
      setStatus("idle");
      onFinishedRef.current(videos);
    },
    [limits.maxDurationSeconds, release],
  );

  const stopTake = useCallback(
    (take: Take) => {
      if (take.stopping || take.disposed) return;
      take.stopping = true;
      clearInterval(take.ticker);
      clearTimeout(take.limitTimer);

      for (const { recorder } of take.captures) {
        if (recorder.state !== "inactive") recorder.stop();
      }
      // Wait for the last chunk of every recorder before the tracks are released.
      void Promise.all(take.captures.map((capture) => capture.stopped)).then(() => finish(take));
    },
    [finish],
  );

  const stop = useCallback(() => {
    if (takeRef.current) stopTake(takeRef.current);
  }, [stopTake]);

  /** Throws the take away (the respondent left, or a recorder failed). */
  const discard = useCallback(
    (take: Take) => {
      take.disposed = true;
      for (const { recorder } of take.captures) {
        if (recorder.state !== "inactive") recorder.stop();
      }
      release(take);
      if (takeRef.current === take) takeRef.current = null;
    },
    [release],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (takeRef.current) discard(takeRef.current);
    };
  }, [discard]);

  const start = useCallback(async () => {
    if (takeRef.current || status !== "idle") return;
    const format = pickRecorderFormat(limits.allowedContentTypes);
    if (!format) {
      setError(UNSUPPORTED);
      return;
    }
    setError(null);
    setStatus("starting");

    const streams: MediaStream[] = [];
    try {
      const acquired: Array<{ kind: RecordingKind; stream: MediaStream }> = [];
      for (const kind of kinds) {
        try {
          const stream = await captureStream(kind);
          streams.push(stream);
          acquired.push({ kind, stream });
        } catch (caught) {
          // Declining an optional kind (the screen) only drops that recording.
          if (REQUIRED_RECORDING_KINDS.includes(kind)) throw caught;
        }
      }
      if (!mountedRef.current) {
        stopTracks(streams);
        return;
      }

      const take: Take = { captures: [], format, startedAt: performance.now(), stopping: false, disposed: false };
      takeRef.current = take;
      const bitrates = recorderBitrates(limits);

      for (const { kind, stream } of acquired) {
        const recorder = new MediaRecorder(stream, { mimeType: format.mimeType, ...bitrates });
        const capture: Capture = {
          kind,
          stream,
          recorder,
          chunks: [],
          startedAt: take.startedAt,
          endedAt: take.startedAt,
          stopped: Promise.resolve(),
        };
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) capture.chunks.push(event.data);
        };
        recorder.onstart = () => {
          capture.startedAt = performance.now();
        };
        capture.stopped = new Promise<void>((resolve) => {
          recorder.onstop = () => {
            capture.endedAt = performance.now();
            resolve();
            // A device that ends by itself ends the whole take.
            stopTake(take);
          };
        });
        recorder.onerror = () => {
          setError("Recording failed. Please try again.");
          setStatus("idle");
          discard(take);
        };
        if (kind === "screen") stream.getVideoTracks()[0]?.addEventListener("ended", () => stopTake(take));

        take.captures.push(capture);
        if (kind === "camera") cameraStreamRef.current = stream;
      }

      for (const { recorder } of take.captures) recorder.start(1000);
      take.startedAt = performance.now();
      take.ticker = setInterval(() => setElapsed(Math.floor((performance.now() - take.startedAt) / 1000)), 1000);
      take.limitTimer = setTimeout(() => stopTake(take), limits.maxDurationSeconds * 1000);

      if (previewRef.current) previewRef.current.srcObject = cameraStreamRef.current;
      setElapsed(0);
      setStatus("recording");
    } catch (caught) {
      stopTracks(streams);
      if (takeRef.current) discard(takeRef.current);
      if (mountedRef.current) {
        setError(describeCaptureError(caught));
        setStatus("idle");
      }
    }
  }, [status, kinds, limits, stopTake, discard]);

  return { status, elapsed, error, previewRef: setPreview, start, stop };
}
