import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import TargetFrame from "@/components/TargetFrame";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, MonitorPlay, Mic, Circle, Square, AlertCircle, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirmBeforeUnload } from "@/hooks/use-confirm-before-unload";
import { useRecordingSession } from "@/hooks/use-recording-session";
import { ENABLED_RECORDING_KINDS } from "@/lib/recording/config";
import type { RecordedVideos, RecordingKind } from "@/lib/recording/types";
import type { RecordingLimits } from "@/lib/respondent-api/types";

/** What happens after the recording itself: sending it, and the outcome. */
type Stage = "idle" | "uploading" | "failed" | "done";

interface RecordingSessionProps {
  /** The page the respondent browses while recording: the project's `targetUrl`. */
  targetURL: string;
  limits: RecordingLimits;
  /** Which recordings to make. The default is `ENABLED_RECORDING_KINDS`; the screen is off there. */
  kinds?: readonly RecordingKind[];
  /**
   * Sends the finished recordings. Resolve `true` once they are stored; `false` keeps them in memory
   * so the respondent can try again without recording again. Show the reason through `error`.
   */
  onRecorded: (videos: RecordedVideos) => Promise<boolean>;
  /** Called a moment after the recordings were stored. */
  onComplete: () => void;
  /** Why the last attempt to send failed. Shown when sending failed. */
  error?: ReactNode;
}

const NOTHING_RECORDED = "Nothing was recorded. Please try again.";
const TOO_LARGE = "Your recording is too large to send. Please record again and keep it shorter.";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

interface RecordingViewProps {
  targetURL: string;
  remaining: number;
  progressPercent: number;
  previewRef: (element: HTMLVideoElement | null) => void;
  onStop: () => void;
}

/**
 * The recording itself: a slim header with every control above a target page that fills the rest of the
 * viewport. It is portalled to `document.body` so that it escapes the stepper, the page padding and the
 * transform of the step transition, which would otherwise make `fixed` position against that ancestor.
 */
const RecordingView = ({ targetURL, remaining, progressPercent, previewRef, onStop }: RecordingViewProps) => {
  // The view covers the screen; keep the page behind it from scrolling (the iframe chains its scroll).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="relative flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-mono font-medium text-destructive">REC</span>
          </div>
          <span className="truncate text-sm font-mono text-muted-foreground">{formatTime(remaining)} remaining</span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Webcam self-view */}
          <div className="h-10 aspect-video overflow-hidden rounded-md border-2 border-accent bg-surface-dark">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <Button onClick={onStop} variant="destructive" className="rounded-full px-6 gap-2">
            <Square className="w-4 h-4" /> Stop & Submit
          </Button>
        </div>

        <Progress value={progressPercent} className="absolute inset-x-0 bottom-0 h-1 rounded-none" />
      </header>

      <div className="relative min-h-0 flex-1 bg-surface-dark">
        <TargetFrame url={targetURL} className="absolute inset-0" />
      </div>
    </motion.div>,
    document.body,
  );
};

const RecordingSession = ({
  targetURL,
  limits,
  kinds = ENABLED_RECORDING_KINDS,
  onRecorded,
  onComplete,
  error,
}: RecordingSessionProps) => {
  const [stage, setStage] = useState<Stage>("idle");
  /** A problem found before anything was sent; `error` covers the ones found while sending. */
  const [notice, setNotice] = useState<string | null>(null);
  // Kept in memory (never stored) so that a failed upload can be retried without recording again.
  const videosRef = useRef<RecordedVideos | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const maxDuration = limits.maxDurationSeconds;
  const includesScreen = kinds.includes("screen");

  const send = useCallback(async () => {
    if (!videosRef.current) return;
    setStage("uploading");
    setStage((await onRecorded(videosRef.current)) ? "done" : "failed");
  }, [onRecorded]);

  const handleFinished = useCallback(
    (videos: RecordedVideos) => {
      const recorded = Object.values(videos);
      if (!videos.camera) {
        setNotice(NOTHING_RECORDED);
        return;
      }
      if (recorded.some((video) => video.blob.size > limits.maxSizeBytes)) {
        videosRef.current = null;
        setNotice(TOO_LARGE);
        setStage("failed");
        return;
      }
      setNotice(null);
      videosRef.current = videos;
      void send();
    },
    [limits.maxSizeBytes, send],
  );

  const recorder = useRecordingSession({ kinds, limits, onFinished: handleFinished });
  const recording = recorder.status === "recording";

  const phase = recording ? "recording" : stage === "idle" ? "instructions" : stage;
  const remaining = Math.max(0, maxDuration - recorder.elapsed);
  const progressPercent = (recorder.elapsed / maxDuration) * 100;

  // Leaving now would lose the recording (and, once it is uploading, the link no longer reopens).
  useConfirmBeforeUnload(phase !== "instructions");

  useEffect(() => {
    if (stage !== "done") return;
    const timer = setTimeout(() => onCompleteRef.current(), 1200);
    return () => clearTimeout(timer);
  }, [stage]);

  const recordAgain = () => {
    videosRef.current = null;
    setNotice(null);
    setStage("idle");
  };

  const cards = [
    { icon: Video, label: "Camera", desc: "We'll record your face" },
    { icon: Mic, label: "Microphone", desc: "Speak your thoughts aloud" },
    ...(includesScreen ? [{ icon: MonitorPlay, label: "Screen", desc: "We'll capture your screen" }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto text-center">
      <AnimatePresence mode="wait">
        {/* ─── INSTRUCTIONS PHASE ─── */}
        {phase === "instructions" && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="flex items-center gap-2 justify-center mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Recording Session</span>
            </div>

            <h2 className="font-display text-3xl font-bold mb-2">Ready to record?</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              You'll browse the target page for up to {Math.floor(maxDuration / 60)} minutes while we record your{" "}
              {includesScreen ? "screen, camera, and voice" : "camera and voice"}.
              {!includesScreen && " Your screen is not recorded."}
            </p>

            <div
              className={`grid gap-4 mb-10 text-left mx-auto ${
                cards.length > 2 ? "sm:grid-cols-3 max-w-lg" : "sm:grid-cols-2 max-w-sm"
              }`}
            >
              {cards.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2"
                >
                  <Icon className="w-6 h-6 text-accent" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>

            {(recorder.error ?? notice) && (
              <Alert variant="destructive" className="mb-6 max-w-md mx-auto text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{recorder.error ?? notice}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={recorder.start}
              disabled={recorder.status === "starting"}
              className="bg-accent text-accent-foreground rounded-full px-8 gap-2 hover:brightness-95"
              size="lg"
            >
              <Circle className="w-4 h-4" /> Start Recording
            </Button>
          </motion.div>
        )}

        {/* ─── RECORDING PHASE ─── */}
        {phase === "recording" && (
          <RecordingView
            key="recording"
            targetURL={targetURL}
            remaining={remaining}
            progressPercent={progressPercent}
            previewRef={recorder.previewRef}
            onStop={recorder.stop}
          />
        )}

        {/* ─── UPLOADING PHASE ─── */}
        {phase === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12"
            role="status"
          >
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <h3 className="font-display text-xl font-semibold">Uploading your recording…</h3>
            <p className="text-sm text-muted-foreground">Please keep this page open until it finishes.</p>
          </motion.div>
        )}

        {/* ─── FAILED PHASE ─── */}
        {phase === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            {notice ? (
              <Alert variant="destructive" className="max-w-md text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            ) : (
              error
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {videosRef.current && (
                <Button onClick={() => void send()} className="rounded-full px-8 gap-2" size="lg">
                  <RotateCcw className="w-4 h-4" /> Try again
                </Button>
              )}
              <Button onClick={recordAgain} variant="outline" className="rounded-full px-8 gap-2" size="lg">
                <Circle className="w-4 h-4" /> Record again
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── DONE PHASE ─── */}
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            <CheckCircle2 className="w-12 h-12 text-accent" />
            <h3 className="font-display text-xl font-semibold">Upload complete!</h3>
            <p className="text-sm text-muted-foreground">Moving to post-session survey…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecordingSession;
