import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, MonitorPlay, Circle, Square, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface RecordingSessionProps {
  onComplete: () => void;
}

const RecordingSession = ({ onComplete }: RecordingSessionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onComplete();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="flex items-center gap-2 justify-center mb-6">
        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
        <span className="text-sm text-muted-foreground">Recording Session</span>
      </div>
      <h2 className="font-display text-3xl font-bold mb-2">Test your product</h2>
      <p className="text-muted-foreground text-sm mb-10">
        Navigate the product naturally. We'll capture your screen and reactions.
      </p>

      {/* Mock recording area */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-video bg-surface-dark rounded-2xl flex flex-col items-center justify-center gap-3 border border-border/20"
        >
          <MonitorPlay className="w-10 h-10 text-surface-dark-muted" />
          <span className="text-sm text-surface-dark-muted">Screen capture</span>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs text-surface-dark-foreground font-mono">{formatTime(elapsed)}</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="aspect-video bg-surface-dark rounded-2xl flex flex-col items-center justify-center gap-3 border border-border/20"
        >
          <Video className="w-10 h-10 text-surface-dark-muted" />
          <span className="text-sm text-surface-dark-muted">Webcam feed</span>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-surface-dark-foreground">Live</span>
            </div>
          )}
        </motion.div>
      </div>

      {!isRecording ? (
        <Button
          onClick={startRecording}
          className="bg-accent text-accent-foreground rounded-full px-8 gap-2 hover:brightness-95"
          size="lg"
        >
          <Circle className="w-4 h-4" /> Start Recording
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          variant="destructive"
          className="rounded-full px-8 gap-2"
          size="lg"
        >
          <Square className="w-4 h-4" /> Stop & Continue
        </Button>
      )}
    </div>
  );
};

export default RecordingSession;
