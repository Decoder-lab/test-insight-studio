import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import ApiErrorState from "@/components/admin/ApiErrorState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasCode } from "@/lib/admin-api/errors";
import { useRecordingPlayback } from "@/lib/admin-api/hooks";
import type { RecordingKind } from "@/lib/admin-api/types";
import { formatBytes, formatDuration } from "@/lib/format";

interface RecordingPlayerProps {
  projectId: string;
  /** Only mount this for a `VERIFIED` recording: the backend answers `not_found` for any other. */
  kind: RecordingKind;
  /** Names the video for assistive technology, e.g. "Camera recording". */
  label: string;
}

/**
 * Plays one verified recording. The signed URL is requested on mount and asked for again once when
 * playback fails, because it expires after 15 minutes. It is only ever used as the video's `src`.
 */
const RecordingPlayer = ({ projectId, kind, label }: RecordingPlayerProps) => {
  const playback = useRecordingPlayback(projectId, kind, true);
  const [renewed, setRenewed] = useState(false);
  const [failed, setFailed] = useState(false);

  if (playback.isPending) {
    return (
      <AspectRatio ratio={16 / 9} role="status" aria-label={`Loading ${label.toLowerCase()}`}>
        <Skeleton className="h-full w-full" />
      </AspectRatio>
    );
  }

  if (playback.isError) {
    // A verified recording whose file is gone will not come back by asking again.
    if (hasCode(playback.error, "not_found")) {
      return <p className="text-sm text-muted-foreground">The recording file could not be found.</p>;
    }
    return <ApiErrorState error={playback.error} onRetry={() => void playback.refetch()} />;
  }

  const { url, durationMs, sizeBytes, contentType } = playback.data;

  const handlePlaybackError = () => {
    if (renewed) {
      setFailed(true);
      return;
    }
    setRenewed(true);
    void playback.refetch();
  };

  const retry = () => {
    setFailed(false);
    void playback.refetch();
  };

  return (
    <div className="space-y-2">
      {failed ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <AlertDescription className="space-y-3">
              <p>This recording could not be played.</p>
              <Button type="button" variant="outline" size="sm" onClick={retry} className="gap-2 rounded-full">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            src={url}
            aria-label={label}
            onError={handlePlaybackError}
            className="h-full w-full"
          />
        </AspectRatio>
      )}
      <p className="text-sm text-muted-foreground">
        {formatDuration(durationMs)} · {formatBytes(sizeBytes)} · {contentType}
      </p>
    </div>
  );
};

export default RecordingPlayer;
