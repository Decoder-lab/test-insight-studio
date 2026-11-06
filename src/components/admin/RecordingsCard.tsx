import RecordingPlayer from "@/components/admin/RecordingPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectDetails, RecordingKind } from "@/lib/admin-api/types";

const KINDS: { kind: RecordingKind; label: string }[] = [
  { kind: "camera", label: "Camera recording" },
  { kind: "screen", label: "Screen recording" },
];

interface RecordingsCardProps {
  projectId: string;
  recordings: ProjectDetails["recordings"];
}

/**
 * The recordings of a project. A player (and its signed URL request) exists only for a verified
 * recording; the other states are explained in words, and the badge lives in the Progress card.
 */
const RecordingsCard = ({ projectId, recordings }: RecordingsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl font-bold">Recordings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {KINDS.map(({ kind, label }) => (
        <section key={kind} aria-labelledby={`recording-${kind}`} className="max-w-2xl space-y-2">
          <h3 id={`recording-${kind}`} className="text-sm font-medium">
            {label}
          </h3>
          {recordings[kind] === "VERIFIED" ? (
            <RecordingPlayer projectId={projectId} kind={kind} label={label} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {recordings[kind] === "UPLOAD_REQUESTED" ? "Upload requested, not verified yet." : "No recording yet."}
            </p>
          )}
        </section>
      ))}
    </CardContent>
  </Card>
);

export default RecordingsCard;
