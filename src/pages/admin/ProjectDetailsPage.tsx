import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import ApiErrorState from "@/components/admin/ApiErrorState";
import InvitationLinkDialog from "@/components/admin/InvitationLinkDialog";
import IssueLinkDialog from "@/components/admin/IssueLinkDialog";
import { InvitationStatusBadge, ProjectStatusBadge, RecordingProgressBadge } from "@/components/admin/StatusBadges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { hasCode } from "@/lib/admin-api/errors";
import { describeFieldValues, formatFieldValue } from "@/lib/admin-api/fields";
import { useIssueInvitation, useProject, useProjectFields, useRevokeInvitation } from "@/lib/admin-api/hooks";
import type { InvitationSummary } from "@/lib/admin-api/types";
import { formatDateTime } from "@/lib/format";

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm">{children}</dd>
  </>
);

const DetailList = ({ children }: { children: React.ReactNode }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[12rem_1fr] sm:gap-y-3">{children}</dl>
);

const InvitationItem = ({
  invitation,
  revoking,
  onRevoke,
}: {
  invitation: InvitationSummary;
  revoking: boolean;
  onRevoke: () => void;
}) => (
  <li className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-3">
      <InvitationStatusBadge status={invitation.status} showHint />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Created</dt>
        <dd>{formatDateTime(invitation.createdAt)}</dd>
        <dt className="text-muted-foreground">Expires</dt>
        <dd>{formatDateTime(invitation.expiresAt)}</dd>
        {invitation.startedAt && (
          <>
            <dt className="text-muted-foreground">Started</dt>
            <dd>{formatDateTime(invitation.startedAt)}</dd>
          </>
        )}
        {invitation.lastUsedAt && (
          <>
            <dt className="text-muted-foreground">Last opened</dt>
            <dd>{formatDateTime(invitation.lastUsedAt)}</dd>
          </>
        )}
        {invitation.revokedAt && (
          <>
            <dt className="text-muted-foreground">Revoked</dt>
            <dd>{formatDateTime(invitation.revokedAt)}</dd>
          </>
        )}
      </dl>
    </div>
    {invitation.status !== "revoked" && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={revoking}
        onClick={onRevoke}
        className="gap-2 self-start rounded-full"
      >
        {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
        Revoke link
      </Button>
    )}
  </li>
);

const BackLink = () => (
  <Button asChild variant="ghost" size="sm" className="-ml-3 gap-2">
    <Link to="/admin">
      <ArrowLeft className="h-4 w-4" />
      All projects
    </Link>
  </Button>
);

const ProjectDetailsPage = () => {
  const { projectId = "" } = useParams();
  const location = useLocation();
  const project = useProject(projectId);
  const fields = useProjectFields();
  const issue = useIssueInvitation();
  const revoke = useRevokeInvitation(projectId);
  const [issueOpen, setIssueOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<InvitationSummary | null>(null);

  if (project.isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading project">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (project.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ApiErrorState
          error={project.error}
          onRetry={hasCode(project.error, "not_found") ? undefined : () => void project.refetch()}
          messages={{ not_found: "This project does not exist." }}
        />
      </div>
    );
  }

  const data = project.data;
  const invitations = [...data.invitations].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const replacing = invitations.some((item) => item.status === "active" || item.status === "started");
  const entries = describeFieldValues(data.fields, fields.data?.items ?? []);
  const linkFailed = (location.state as { linkFailed?: boolean } | null)?.linkFailed === true && invitations.length === 0;

  const openIssueDialog = () => {
    issue.reset();
    setIssueOpen(true);
  };

  const submitIssue = async (expiresInHours: number) => {
    try {
      await issue.issue({ projectId, expiresInHours });
      setIssueOpen(false); // the one-time link dialog takes over
    } catch {
      // Shown inside the dialog from `issue.error`.
    }
  };

  const confirmRevoke = () => {
    if (revokeTarget) revoke.mutate(revokeTarget.id);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      {linkFailed && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The project was created, but its link could not be created. Use “Create link” below to try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="break-words font-display text-2xl font-bold">{data.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ProjectStatusBadge status={data.status} />
            <span className="text-sm text-muted-foreground">Created {formatDateTime(data.createdAt)}</span>
            {data.readyAt && <span className="text-sm text-muted-foreground">Ready {formatDateTime(data.readyAt)}</span>}
          </div>
        </CardHeader>
        {entries.length > 0 && (
          <CardContent>
            <DetailList>
              {entries.map((entry) => (
                <Detail key={entry.key} label={entry.label}>
                  {formatFieldValue(entry.value)}
                </Detail>
              ))}
            </DetailList>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-bold">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList>
            <Detail label="Questionnaire">{data.questionnaireSubmitted ? "Submitted" : "Not submitted"}</Detail>
            <Detail label="Camera recording">
              <RecordingProgressBadge progress={data.recordings.camera} />
            </Detail>
            <Detail label="Screen recording">
              <RecordingProgressBadge progress={data.recordings.screen} />
            </Detail>
          </DetailList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="font-display text-xl font-bold">Respondent link</CardTitle>
            <CardDescription>
              {data.status === "READY"
                ? "This test is complete, so no new link can be created."
                : "The link itself is only shown once, when it is created."}
            </CardDescription>
          </div>
          {data.status !== "READY" && (
            <Button
              type="button"
              onClick={openIssueDialog}
              className="rounded-full bg-accent text-accent-foreground hover:brightness-95"
            >
              {replacing ? "Renew link" : "Create link"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No link has been created yet.</p>
          ) : (
            <ul className="space-y-3">
              {invitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  revoking={revoke.isPending && revoke.variables === invitation.id}
                  onRevoke={() => {
                    revoke.reset();
                    setRevokeTarget(invitation);
                  }}
                />
              ))}
            </ul>
          )}
          {revoke.isError && (
            <ApiErrorState
              error={revoke.error}
              messages={{ not_found: "This link no longer exists. Reload the page to see the current state." }}
            />
          )}
        </CardContent>
      </Card>

      <IssueLinkDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        replacing={replacing}
        pending={issue.isPending}
        error={issue.error}
        onSubmit={(hours) => void submitIssue(hours)}
      />
      <InvitationLinkDialog link={issue.link} onClose={issue.dismiss} />

      <AlertDialog open={revokeTarget !== null} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this link?</AlertDialogTitle>
            <AlertDialogDescription>It stops working immediately. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>Revoke link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetailsPage;
