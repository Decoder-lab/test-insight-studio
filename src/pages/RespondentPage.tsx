/**
 * PLACEHOLDER for the respondent entry (`/test#invite=<token>`).
 * The real flow will replace this page, reusing the steps of the old demo (`TestPage`).
 * It deliberately never reads or shows the token: it is a password.
 */
const RespondentPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted px-4">
    <div className="max-w-md text-center">
      <h1 className="mb-4 text-3xl font-bold">Invitation required</h1>
      <p className="mb-4 text-lg text-muted-foreground">
        This test can only be started from a personal invitation link sent to you by the research team.
      </p>
      <a href="/" className="text-primary underline hover:text-primary/90">
        Return to Home
      </a>
    </div>
  </div>
);

export default RespondentPage;
