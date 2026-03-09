import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PreSurvey from "@/components/PreSurvey";
import RecordingSession from "@/components/RecordingSession";
import PostSurvey from "@/components/PostSurvey";
import { motion, AnimatePresence } from "framer-motion";

type Step = "pre-survey" | "recording" | "post-survey";

const TestPage = () => {
  const [step, setStep] = useState<Step>("pre-survey");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      {/* Progress */}
      <div className="max-w-lg mx-auto mb-12 flex items-center gap-2">
        {(["pre-survey", "recording", "post-survey"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${
              (["pre-survey", "recording", "post-survey"].indexOf(step) >= i)
                ? "bg-accent"
                : "bg-border"
            }`} />
          </div>
        ))}
      </div>

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
              onComplete={() => setStep("post-survey")}
              maxDuration={120}
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
