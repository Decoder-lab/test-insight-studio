import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_EXPIRY_HOURS, isValidExpiry, MAX_EXPIRY_HOURS, MIN_EXPIRY_HOURS } from "@/lib/admin-api/fields";
import ApiErrorState from "./ApiErrorState";
import ExpiryPicker from "./ExpiryPicker";

interface IssueLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True when an open link exists: creating a new one disables it, so the user must confirm. */
  replacing: boolean;
  pending: boolean;
  error: unknown;
  onSubmit: (expiresInHours: number) => void;
}

/**
 * Renders the form for creating or renewing an issue link, including the expiry picker and error state.
 * @param replacing True when an open link exists: creating a new one disables it, so the user must confirm.
 * @param pending True when the form is in a pending state.
 * @param error The error object to display.
 * @param onSubmit Callback when the form is submitted.
 * @param onCancel Callback when the form is cancelled.
 * @returns The rendered issue link form component.
 */
const IssueLinkForm = ({ replacing, pending, error, onSubmit, onCancel }: Omit<IssueLinkDialogProps, "open" | "onOpenChange"> & { onCancel: () => void }) => {
  const [hours, setHours] = useState(DEFAULT_EXPIRY_HOURS);
  const valid = isValidExpiry(hours);

  return (
    <>
      <ExpiryPicker
        value={hours}
        onChange={setHours}
        disabled={pending}
        error={valid ? undefined : `Enter a whole number of hours from ${MIN_EXPIRY_HOURS} to ${MAX_EXPIRY_HOURS}.`}
      />

      {Boolean(error) && (
        <ApiErrorState
          error={error}
          onRetry={() => valid && onSubmit(hours)}
          messages={{
            conflict: "This test is already complete, so a new link cannot be created.",
            not_found: "This project no longer exists.",
            validation_error: "The link expiry was rejected. Pick a value between 1 hour and 30 days.",
          }}
        />
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="rounded-full">
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!valid || pending}
          onClick={() => onSubmit(hours)}
          className="gap-2 rounded-full bg-accent text-accent-foreground hover:brightness-95"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {replacing ? "Renew link" : "Create link"}
        </Button>
      </DialogFooter>
    </>
  );
};

/** 
 * Creates or renews the respondent link: confirmation (when it replaces one) plus the expiry choice.
 * @param open Whether the dialog is open.
 * @param onOpenChange Callback when the open state changes.
 * @param replacing True when an open link exists: creating a new one disables it, so the user must confirm.
 * @param pending True when the form is in a pending state.
 * @param error The error object to display.
 * @param onSubmit Callback when the form is submitted.
 * @param onCancel Callback when the form is cancelled.
 * @returns The rendered issue link dialog component.
 */
const IssueLinkDialog = ({ open, onOpenChange, replacing, pending, error, onSubmit }: IssueLinkDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{replacing ? "Renew link" : "Create link"}</DialogTitle>
        <DialogDescription>
          {replacing
            ? "This will disable the current link. Choose how long the new one stays valid."
            : "Choose how long the link stays valid."}
        </DialogDescription>
      </DialogHeader>
      {open && (
        <IssueLinkForm
          replacing={replacing}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default IssueLinkDialog;
