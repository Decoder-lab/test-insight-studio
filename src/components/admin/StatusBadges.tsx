import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvitationStatus, ProjectStatus, RecordingProgress } from "@/lib/admin-api/types";

const PROJECT_STATUS: Record<ProjectStatus, { label: string; className: string }> = {
  CREATED: { label: "Created", className: "border-transparent bg-secondary text-secondary-foreground" },
  IN_PROGRESS: { label: "In progress", className: "border-border bg-background text-foreground" },
  READY: { label: "Ready", className: "border-transparent bg-accent text-accent-foreground" },
};

/**
 * Displays the status of a project as a badge.
 */
export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => {
  const known = PROJECT_STATUS[status];
  return <Badge className={cn("whitespace-nowrap", known?.className)}>{known?.label ?? status}</Badge>;
};

// Plain wording for each state; the backend decides which one applies (revoked > started > expired > active).
const INVITATION_STATUS: Record<InvitationStatus, { label: string; hint: string; className: string }> = {
  active: { label: "Active", hint: "Link works", className: "border-transparent bg-accent text-accent-foreground" },
  started: { label: "Started", hint: "Link no longer opens", className: "border-border bg-background text-foreground" },
  expired: { label: "Expired", hint: "Link no longer opens", className: "border-transparent bg-secondary text-secondary-foreground" },
  revoked: { label: "Revoked", hint: "Link disabled", className: "border-transparent bg-destructive/10 text-destructive" },
};

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  /** Adds the plain-language consequence, e.g. "Started - link no longer opens". */
  showHint?: boolean;
}

/**
 * Displays the status of an invitation as a badge, optionally with a hint.
 */
export const InvitationStatusBadge = ({ status, showHint = false }: InvitationStatusBadgeProps) => {
  const known = INVITATION_STATUS[status];
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge className={cn("whitespace-nowrap", known?.className)}>{known?.label ?? status}</Badge>
      {showHint && known && <span className="text-sm text-muted-foreground">{known.hint}</span>}
    </span>
  );
};

const RECORDING: Record<RecordingProgress, { label: string; className: string }> = {
  NOT_STARTED: { label: "Not started", className: "border-transparent bg-secondary text-secondary-foreground" },
  UPLOAD_REQUESTED: { label: "Upload requested", className: "border-border bg-background text-foreground" },
  VERIFIED: { label: "Verified", className: "border-transparent bg-accent text-accent-foreground" },
};

/**
 * Displays the progress of a recording as a badge.
 */
export const RecordingProgressBadge = ({ progress }: { progress: RecordingProgress }) => {
  const known = RECORDING[progress];
  return <Badge className={cn("whitespace-nowrap", known?.className)}>{known?.label ?? progress}</Badge>;
};
