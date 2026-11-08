import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import TargetFrame from "@/components/TargetFrame";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TargetUrlCheckDialogProps {
  /** The address to try; `null` closes the dialog and unloads the page. */
  url: string | null;
  onClose: () => void;
}

const CheckBody = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-surface-dark">
        <TargetFrame url={url} title="Target page preview" className="absolute inset-0" onLoad={() => setLoaded(true)} />
        {!loaded && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the page…
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground" title={url}>
          {url}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" className="gap-2 rounded-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </Button>
          <Button type="button" onClick={onClose} className="rounded-full bg-accent text-accent-foreground hover:brightness-95">
            Done
          </Button>
        </div>
      </div>
    </>
  );
};

/**
 * Shows the target page the way a respondent will see it, so the administrator can tell before creating
 * the test whether the page can be shown in an iframe. The browser fires the frame's load event even for
 * a page that refused to be framed, and a cross-origin page cannot be inspected, so nothing here can say
 * "works" or "blocked": the administrator looks at it.
 */
const TargetUrlCheckDialog = ({ url, onClose }: TargetUrlCheckDialogProps) => (
  <Dialog open={url !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="flex h-[90vh] w-[96vw] max-w-[96vw] flex-col gap-3 p-4 sm:max-w-[min(96vw,1600px)]">
      <DialogHeader className="pr-6">
        <DialogTitle>Check the target page</DialogTitle>
        <DialogDescription>
          This is how the page loads for a respondent. If it stays blank or says it refused to connect, the site does
          not allow being shown in an iframe and respondents will not be able to use it.
        </DialogDescription>
      </DialogHeader>
      {/* Mounted only while open: the page loads on click and stops loading on close. */}
      {url !== null && <CheckBody key={url} url={url} onClose={onClose} />}
    </DialogContent>
  </Dialog>
);

export default TargetUrlCheckDialog;
