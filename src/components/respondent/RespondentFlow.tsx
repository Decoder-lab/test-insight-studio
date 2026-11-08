import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PostSurvey, { type PostSurveyAnswers } from "@/components/PostSurvey";
import PreSurvey, { type PreSurveyAnswers } from "@/components/PreSurvey";
import RecordingSession from "@/components/RecordingSession";
import TestStepper from "@/components/TestStepper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirmBeforeUnload } from "@/hooks/use-confirm-before-unload";
import { REQUIRED_RECORDING_KINDS } from "@/lib/recording/config";
import { describeRespondentError } from "@/lib/respondent-api/errors";
import { useCompleteProject, useRecordingUpload, useSubmitQuestionnaire } from "@/lib/respondent-api/hooks";
import type { RespondentProject } from "@/lib/respondent-api/types";

type FlowStep = "pre-survey" | "recording" | "post-survey" | "done";

/** `outcome` says what the failure means for the respondent's data; the server's message is never shown. */
const FlowError = ({ error, outcome }: { error: unknown; outcome: string }) =>
  error === null ? null : (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {describeRespondentError(error)} {outcome}
      </AlertDescription>
    </Alert>
  );

const ANSWERS_NOT_SENT = "Your answers were not sent.";
const RECORDING_NOT_SENT = "Your recording was not sent.";
const NOT_FINISHED = "Your answers were saved, but the test could not be finished.";

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
 * Each step is sent to the backend as soon as it is done, and the respondent only moves on once the
 * backend accepted it. The recording is made in the browser (camera with microphone) and uploaded
 * straight to Storage; the post-survey is followed by completing the project.
 *
 * The questionnaire endpoint replaces the stored answers as a whole, so the post-survey submission
 * repeats the pre-survey answers (kept in memory only). The token is a password: it goes straight to
 * the API client and is never rendered or stored.
 */
const RespondentFlow = ({ token, project }: { token: string; project: RespondentProject }) => {
  const [step, setStep] = useState<FlowStep>("pre-survey");
  const [preSurvey, setPreSurvey] = useState<PreSurveyAnswers | null>(null);
  // The post-survey the backend already has, so that retrying only `complete` does not send it again.
  const storedPostSurvey = useRef<string | null>(null);
  const { submit, error } = useSubmitQuestionnaire(token);
  const { upload, error: uploadError } = useRecordingUpload(token);
  const { complete, error: completeError } = useCompleteProject(token);

  // The upload starts the test, so from the recording on a reload cannot be undone: the link no longer opens.
  useConfirmBeforeUnload(step === "post-survey");

  // A renewed invitation can belong to a project whose recording is already verified. That is final
  // (the backend answers `409` to a new upload URL), so the respondent goes straight to the post-survey.
  const recordingStored = REQUIRED_RECORDING_KINDS.every((kind) => project.progress.recordings[kind] === "VERIFIED");

  const submitPreSurvey = async (answers: PreSurveyAnswers) => {
    if (!(await submit({ preSurvey: answers }))) return;
    setPreSurvey(answers);
    setStep(recordingStored ? "post-survey" : "recording");
  };

  const submitPostSurvey = async (answers: PostSurveyAnswers) => {
    if (!preSurvey) return;
    const serialized = JSON.stringify(answers);
    if (storedPostSurvey.current !== serialized) {
      if (!(await submit({ preSurvey, postSurvey: answers }))) return;
      storedPostSurvey.current = serialized;
    }
    if (await complete()) setStep("done");
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
          {step === "pre-survey" && (
            <PreSurvey
              onComplete={submitPreSurvey}
              error={<FlowError error={error} outcome={ANSWERS_NOT_SENT} />}
              submitLabel={recordingStored ? "Continue" : undefined}
            />
          )}
          {step === "recording" && (
            <RecordingSession
              targetURL={project.targetUrl}
              limits={project.limits}
              onRecorded={upload}
              onComplete={() => setStep("post-survey")}
              error={<FlowError error={uploadError} outcome={RECORDING_NOT_SENT} />}
            />
          )}
          {step === "post-survey" && (
            <PostSurvey
              onComplete={submitPostSurvey}
              error={
                error === null ? (
                  <FlowError error={completeError} outcome={NOT_FINISHED} />
                ) : (
                  <FlowError error={error} outcome={ANSWERS_NOT_SENT} />
                )
              }
              submitLabel="Submit"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RespondentFlow;
