import FullPageSpinner from "@/components/FullPageSpinner";
import { ProjectStatusBadge, RecordingProgressBadge } from "@/components/admin/StatusBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvitationToken } from "@/hooks/use-invitation-token";
import { describeRespondentError, isRetryable } from "@/lib/respondent-api/errors";
import { useInvitationProject } from "@/lib/respondent-api/hooks";
import type { RespondentProject } from "@/lib/respondent-api/types";
import { formatBytes } from "@/lib/format";

/**
 * PLACEHOLDER for the respondent entry (`/test#invite=<token>`).
 * It validates the invitation against the backend and shows what the backend returns. The real
 * flow will replace the details card, reusing the steps of the old demo (`TestPage`).
 * The token is a password: it is read from the URL fragment (and removed from the address bar) and
 * passed to the API client, but never rendered, stored or logged.
 */

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-muted px-4">{children}</div>
);

const HomeLink = () => (
  <a href="/" className="text-primary underline hover:text-primary/90">
    Return to Home
  </a>
);

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="font-medium">{children}</dd>
  </div>
);

const ProjectDetails = ({ project }: { project: RespondentProject }) => {
  const { limits, progress } = project;
  return (
    <Screen>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Placeholder for the test</CardTitle>
          <CardDescription>
            Some details from the backend. The real test (consent, device check, survey and recordings) will replace
            this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <Detail label="Project">{project.name}</Detail>
            <Detail label="Status">
              <ProjectStatusBadge status={project.status} />
            </Detail>
            <Detail label="Longest recording">{limits.maxDurationSeconds} seconds</Detail>
            <Detail label="Largest recording file">{formatBytes(limits.maxSizeBytes)}</Detail>
            <Detail label="Recording formats">{limits.allowedContentTypes.join(", ") || "—"}</Detail>
            <Detail label="Questionnaire">{progress.questionnaireSubmitted ? "Submitted" : "Not submitted"}</Detail>
            <Detail label="Camera recording">
              <RecordingProgressBadge progress={progress.recordings.camera} />
            </Detail>
            <Detail label="Screen recording">
              <RecordingProgressBadge progress={progress.recordings.screen} />
            </Detail>
          </dl>
        </CardContent>
      </Card>
    </Screen>
  );
};

const RespondentPage = () => {
  const token = useInvitationToken();
  const state = useInvitationProject(token);

  if (!token) {
    return (
      <Screen>
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold">Invitation required</h1>
          <p className="mb-4 text-lg text-muted-foreground">
            This test can only be started from a personal invitation link sent to you by the research team.
          </p>
          <HomeLink />
        </div>
      </Screen>
    );
  }

  if (state.status === "loading") return <FullPageSpinner />;
  if (state.status === "ready") return <ProjectDetails project={state.project} />;

  return (
    <Screen>
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold">We couldn't open this invitation</h1>
        <p role="alert" className="mb-4 text-lg text-muted-foreground">
          {describeRespondentError(state.error)}
        </p>
        <div className="flex flex-col items-center gap-3">
          {isRetryable(state.error) && <Button onClick={state.retry}>Retry</Button>}
          <HomeLink />
        </div>
      </div>
    </Screen>
  );
};

export default RespondentPage;
