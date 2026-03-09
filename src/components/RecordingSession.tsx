import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, MonitorPlay, Circle, Square, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RecordingPhase = "instructions" | "recording" | "uploading" | "done";

interface RecordingSessionProps {
  targetURL?: string;
  onComplete: (webcamBlob?: Blob, screenBlob?: Blob, audioBlob?: Blob) => void;
  maxDuration?: number;
}

const RecordingSession = ({
  targetURL = "https://example.com",
  onComplete,
  maxDuration = 120,
}: RecordingSessionProps) => {
  const [phase, setPhase] = useState<RecordingPhase>("instructions");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamChunks = useRef<Blob[]>([]);
  const screenChunks = useRef<Blob[]>([]);
  const audioChunks = useRef<Blob[]>([]);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const elapsedRef = useRef(0);

  const remaining = maxDuration - elapsed;
  const progressPercent = (elapsed / maxDuration) * 100;

  // Warn on close during recording
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase === "recording") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const createRecorder = (stream: MediaStream, chunks: React.MutableRefObject<Blob[]>) => {
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    return recorder;
  };

  const startRecording = async () => {
    setError(null);
    try {
      // Request webcam + audio
      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      webcamStreamRef.current = webcamStream;

      // Show webcam preview
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = webcamStream;
      }

      // Request screen capture
      let screenStream: MediaStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" } as any,
          audio: false,
        });
      } catch {
        // User cancelled screen share — still allow webcam-only
        screenStream = new MediaStream();
      }
      screenStreamRef.current = screenStream;

      // Create recorders
      webcamChunks.current = [];
      screenChunks.current = [];
      audioChunks.current = [];

      // Webcam recorder (video only)
      const webcamVideoTrack = webcamStream.getVideoTracks()[0];
      if (webcamVideoTrack) {
        const wcStream = new MediaStream([webcamVideoTrack]);
        webcamRecorderRef.current = createRecorder(wcStream, webcamChunks);
        webcamRecorderRef.current.start(1000);
      }

      // Screen recorder
      if (screenStream.getVideoTracks().length > 0) {
        screenRecorderRef.current = createRecorder(screenStream, screenChunks);
        screenRecorderRef.current.start(1000);

        // Stop recording if user ends screen share
        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };
      }

      // Audio recorder
      const audioTrack = webcamStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioStream = new MediaStream([audioTrack]);
        const audioMime = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";
        const audioRec = new MediaRecorder(audioStream, { mimeType: audioMime });
        audioRec.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.current.push(e.data);
        };
        audioRecorderRef.current = audioRec;
        audioRec.start(1000);
      }

      setPhase("recording");
      setElapsed(0);
      elapsedRef.current = 0;

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera/microphone permission denied. Please allow access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No camera or microphone found. Please connect a device and try again.");
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const stop = (rec: MediaRecorder | null) => {
      if (rec && rec.state !== "inactive") rec.stop();
    };

    stop(webcamRecorderRef.current);
    stop(screenRecorderRef.current);
    stop(audioRecorderRef.current);

    // Give recorders time to flush
    setTimeout(() => {
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());

      const webcamBlob = webcamChunks.current.length
        ? new Blob(webcamChunks.current, { type: "video/webm" })
        : undefined;
      const screenBlob = screenChunks.current.length
        ? new Blob(screenChunks.current, { type: "video/webm" })
        : undefined;
      const audioBlob = audioChunks.current.length
        ? new Blob(audioChunks.current, { type: "audio/webm" })
        : undefined;

      // Simulate upload progress
      setPhase("uploading");
      let prog = 0;
      const uploadInterval = setInterval(() => {
        prog += Math.random() * 15 + 5;
        if (prog >= 100) {
          prog = 100;
          clearInterval(uploadInterval);
          setUploadProgress(100);
          setPhase("done");
          setTimeout(() => onComplete(webcamBlob, screenBlob, audioBlob), 1200);
        }
        setUploadProgress(Math.min(prog, 100));
      }, 300);
    }, 500);
  }, [onComplete]);

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
              You'll browse the target page for up to {Math.floor(maxDuration / 60)} minutes while we
              capture your screen, camera, and voice.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-lg mx-auto">
              {[
                { icon: Video, label: "Webcam", desc: "We'll record your face" },
                { icon: MonitorPlay, label: "Screen", desc: "We'll capture your screen" },
                {
                  icon: Circle,
                  label: "Audio",
                  desc: "Speak your thoughts aloud",
                },
              ].map(({ icon: Icon, label, desc }) => (
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

            {error && (
              <Alert variant="destructive" className="mb-6 max-w-md mx-auto text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={startRecording}
              className="bg-accent text-accent-foreground rounded-full px-8 gap-2 hover:brightness-95"
              size="lg"
            >
              <Circle className="w-4 h-4" /> Start Recording
            </Button>
          </motion.div>
        )}

        {/* ─── RECORDING PHASE ─── */}
        {phase === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {/* Timer + progress */}
            <div className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-mono font-medium text-destructive">REC</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {formatTime(remaining)} remaining
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5 mb-6 max-w-2xl mx-auto" />

            {/* Recording area */}
            <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden border border-border bg-surface-dark mb-8">
              {/* Target page iframe */}
              <iframe
                src={targetURL}
                title="Target page"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />

              {/* Webcam PiP */}
              <div className="absolute bottom-3 right-3 w-32 aspect-video rounded-lg overflow-hidden border-2 border-accent shadow-lg bg-surface-dark">
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            </div>

            <Button
              onClick={stopRecording}
              variant="destructive"
              className="rounded-full px-8 gap-2"
              size="lg"
            >
              <Square className="w-4 h-4" /> Stop & Submit
            </Button>
          </motion.div>
        )}

        {/* ─── UPLOADING PHASE ─── */}
        {phase === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            <Upload className="w-10 h-10 text-accent animate-bounce" />
            <h3 className="font-display text-xl font-semibold">Uploading recordings…</h3>
            <Progress value={uploadProgress} className="h-2 w-64" />
            <span className="text-sm text-muted-foreground font-mono">
              {Math.round(uploadProgress)}%
            </span>
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
