import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PreSurvey from "@/components/PreSurvey";
import RecordingSession from "@/components/RecordingSession";
import PostSurvey from "@/components/PostSurvey";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Step = "pre-survey" | "recording" | "post-survey";

const stepLabels: Record<Step, string> = {
  "pre-survey": "Pre-Survey",
  recording: "Recording",
  "post-survey": "Post-Survey",
};

const stepOrder: Step[] = ["pre-survey", "recording", "post-survey"];

const TestPage = () => {
  const [step, setStep] = useState<Step>("pre-survey");
  const navigate = useNavigate();
  const currentIndex = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Demo badge + Breadcrumbs */}
        <div className="flex items-center gap-3 mb-6">
          <Badge className="bg-accent/15 text-accent border-accent/30 border text-xs font-semibold shrink-0">
            DEMO
          </Badge>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-default">Test</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{stepLabels[step]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  currentIndex >= i ? "bg-accent" : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-between mb-8 text-xs text-muted-foreground">
          {stepOrder.map((s, i) => (
            <span
              key={s}
              className={`font-medium ${currentIndex >= i ? "text-accent" : ""}`}
            >
              {stepLabels[s]}
            </span>
          ))}
        </div>
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
