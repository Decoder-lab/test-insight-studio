import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PreSurvey from "@/components/PreSurvey";
import RecordingSession from "@/components/RecordingSession";
import type { RecordingLimits } from "@/lib/respondent-api/types";
import PostSurvey from "@/components/PostSurvey";
import TestStepper, { type Step } from "@/components/TestStepper";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const DEMO_LIMITS: RecordingLimits = {
  maxDurationSeconds: 120,
  maxSizeBytes: 50 * 1024 * 1024,
  allowedContentTypes: ["video/webm", "video/mp4"],
};

// Demo only: the recording is made in the browser, but nothing is sent anywhere.
const pretendToUpload = () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1500));

const TestPage = () => {
  const [step, setStep] = useState<Step>("pre-survey");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <TestStepper
        step={step}
        badge={
          <Badge className="bg-accent/15 text-accent border-accent/30 border text-xs font-semibold shrink-0">
            DEMO
          </Badge>
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === "pre-survey" && (
            <PreSurvey onComplete={() => setStep("recording")} />
          )}
          {step === "recording" && (
            <RecordingSession
              targetURL="https://example.com"
              limits={DEMO_LIMITS}
              onRecorded={pretendToUpload}
              onComplete={() => setStep("post-survey")}
            />
          )}
          {step === "post-survey" && (
            <PostSurvey onComplete={() => navigate("/results/demo-session")} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TestPage;
