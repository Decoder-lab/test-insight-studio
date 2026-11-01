import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { describeError, isAdminApiError } from "@/lib/admin-api/errors";
import type { ErrorCode } from "@/lib/admin-api/types";

interface ApiErrorStateProps {
  /** The error object to display. */
  error: unknown;
  /** Shown as a "Retry" button where trying again can help. */
  onRetry?: () => void;
  /** Action-specific wording for envelope error codes, e.g. `{ conflict: "…" }`. */
  messages?: Partial<Record<ErrorCode, string>>;
  /** Additional CSS class for the root element. */
  className?: string;
}

/** 
 * One place for how admin API failures look: not ready, unreachable, not an administrator, and the rest.
 * @param error The error object to display.
 * @param onRetry Shown as a "Retry" button where trying again can help.
 * @param messages Action-specific wording for envelope error codes, e.g. `{ conflict: "…" }`.
 * @param className Additional CSS class for the root element.
 */
const ApiErrorState = ({ error, onRetry, messages, className }: ApiErrorStateProps) => {
  const kind = isAdminApiError(error) ? error.kind : "unexpected";
  const retryable = kind === "network" || kind === "not_ready" || kind === "unexpected" || kind === "api";

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <div>
        {kind === "not_ready" && <AlertTitle>Backend not ready</AlertTitle>}
        <AlertDescription className="space-y-3">
          {kind !== "not_ready" && <p>{describeError(error, messages)}</p>}
          {kind === "not_ready" && (
            <p className="text-muted-foreground">
              The admin API is not deployed or not implemented yet. Nothing was saved.
              {import.meta.env.DEV && " For development, set VITE_ADMIN_API_MOCK=on to use sample data."}
            </p>
          )}
          {onRetry && retryable && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2 rounded-full">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ApiErrorState;
