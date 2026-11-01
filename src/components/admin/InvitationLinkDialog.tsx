import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IssuedLink } from "@/lib/admin-api/hooks";
import { formatDateTime } from "@/lib/format";

type CopyState = "idle" | "copied" | "failed";

/** 
 * The body of the invitation link dialog, showing the link and copy controls. 
 * @param link The issued invitation link to display.
 * @param onClose Callback to close the dialog.
 */
const LinkBody = ({ link, onClose }: { link: IssuedLink; onClose: () => void }) => {
  const [copy, setCopy] = useState<CopyState>("idle");

  // Reset copy state when the link changes.
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopy("copied");
    } catch {
      // Clipboard access can be missing (insecure context) or denied; the link stays selectable.
      setCopy("failed");
    }
  };

  return (
    <>
      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>
          <strong>You will not be able to see this link again.</strong> Copy it now and share it with the respondent.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="invitation-link">Link</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="invitation-link"
            readOnly
            value={link.url}
            autoComplete="off"
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
          />
          <Button type="button" variant="outline" onClick={onCopy} className="gap-2 sm:w-28">
            {copy === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copy === "copied" ? "Copied" : "Copy"}
          </Button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {copy === "failed" && "Could not copy automatically. Select the link above and copy it."}
        </p>
        <p className="text-sm text-muted-foreground">Expires {formatDateTime(link.expiresAt)}.</p>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onClose} className="rounded-full bg-accent text-accent-foreground hover:brightness-95">
          Done
        </Button>
      </DialogFooter>
    </>
  );
};

interface InvitationLinkDialogProps {
  /** The link while it is on screen; `null` closes the dialog and leaves nothing of the token behind. */
  link: IssuedLink | null;
  onClose: () => void;
}

/** 
 * Shows a freshly created invitation link. The backend never returns the token again. 
 * @param link The issued invitation link to display.
 * @param onClose Callback to close the dialog.
 */
const InvitationLinkDialog = ({ link, onClose }: InvitationLinkDialogProps) => (
  <Dialog open={link !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      // Closing loses the link for good, so only the explicit buttons close it.
      onInteractOutside={(event) => event.preventDefault()}
      onEscapeKeyDown={(event) => event.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Invitation link</DialogTitle>
        <DialogDescription>Anyone with this link can start the test.</DialogDescription>
      </DialogHeader>
      {link && <LinkBody link={link} onClose={onClose} />}
    </DialogContent>
  </Dialog>
);

export default InvitationLinkDialog;
