import FullPageSpinner from "@/components/FullPageSpinner";
import RespondentFlow from "@/components/respondent/RespondentFlow";
import { Button } from "@/components/ui/button";
import { useInvitationToken } from "@/hooks/use-invitation-token";
import { describeRespondentError, isRetryable } from "@/lib/respondent-api/errors";
import { useInvitationProject } from "@/lib/respondent-api/hooks";

/**
 * The respondent entry (`/test#invite=<token>`): validates the invitation against the backend and
 * then runs the test (`RespondentFlow`). Without a valid invitation it explains why it cannot open.
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
  if (state.status === "ready") return <RespondentFlow token={token} />;

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
