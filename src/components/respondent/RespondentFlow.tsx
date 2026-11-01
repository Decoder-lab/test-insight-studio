import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PostSurvey, { type PostSurveyAnswers } from "@/components/PostSurvey";
import PreSurvey, { type PreSurveyAnswers } from "@/components/PreSurvey";
import RecordingSession from "@/components/RecordingSession";
import TestStepper from "@/components/TestStepper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { describeRespondentError } from "@/lib/respondent-api/errors";
import { useSubmitQuestionnaire } from "@/lib/respondent-api/hooks";

type FlowStep = "pre-survey" | "recording" | "post-survey" | "done";

const SubmitError = ({ error }: { error: unknown }) =>
  error === null ? null : (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{describeRespondentError(error)} Your answers were not sent.</AlertDescription>
    </Alert>
  );

const ThankYou = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex max-w-md flex-col items-center gap-4 text-center"
    >
      <CheckCircle2 className="h-12 w-12 text-accent" />
      <h1 className="font-display text-3xl font-bold">Thank you!</h1>
      <p className="text-muted-foreground">
        Your answers have been submitted. You can close this page now.
      </p>
    </motion.div>
  </div>
);

/**
 * The respondent's test: pre-survey, recording, post-survey, then a thank-you page.
 * Each survey is sent to the backend as soon as it is submitted, and the respondent only moves on
 * once the backend accepted it. The recording step is the demo `RecordingSession`: it is simulated
 * and nothing is uploaded yet.
 *
 * The questionnaire endpoint replaces the stored answers as a whole, so the post-survey submission
 * repeats the pre-survey answers (kept in memory only). The token is a password: it goes straight to
 * the API client and is never rendered or stored.
 */
const RespondentFlow = ({ token }: { token: string }) => {
  const [step, setStep] = useState<FlowStep>("pre-survey");
  const [preSurvey, setPreSurvey] = useState<PreSurveyAnswers | null>(null);
  const { submit, error } = useSubmitQuestionnaire(token);

  const submitPreSurvey = async (answers: PreSurveyAnswers) => {
    if (!(await submit({ preSurvey: answers }))) return;
    setPreSurvey(answers);
    setStep("recording");
  };

  const submitPostSurvey = async (answers: PostSurveyAnswers) => {
    if (!preSurvey || !(await submit({ preSurvey, postSurvey: answers }))) return;
    setStep("done");
  };

  if (step === "done") return <ThankYou />;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <TestStepper step={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === "pre-survey" && <PreSurvey onComplete={submitPreSurvey} error={<SubmitError error={error} />} />}
          {step === "recording" && (
            <RecordingSession
              targetURL="https://example.com"
              onComplete={() => setStep("post-survey")}
              maxDuration={120}
            />
          )}
          {step === "post-survey" && (
            <PostSurvey onComplete={submitPostSurvey} error={<SubmitError error={error} />} submitLabel="Submit" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RespondentFlow;
