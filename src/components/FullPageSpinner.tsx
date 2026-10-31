import { Loader2 } from "lucide-react";

const FullPageSpinner = () => (
  <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default FullPageSpinner;
