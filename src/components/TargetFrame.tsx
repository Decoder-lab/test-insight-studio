import { cn } from "@/lib/utils";

/**
 * What the target page may do inside the frame. The respondent's recording and the administrator's
 * pre-check use this one component, so a page that loads in the check loads for the respondent too.
 */
export const TARGET_FRAME_SANDBOX = "allow-scripts allow-same-origin allow-popups";

interface TargetFrameProps {
  url: string;
  title?: string;
  className?: string;
  /** Fires when the frame finished loading, also when the browser showed its own "refused to connect" page. */
  onLoad?: () => void;
}

const TargetFrame = ({ url, title = "Target page", className, onLoad }: TargetFrameProps) => (
  <iframe
    src={url}
    title={title}
    className={cn("h-full w-full border-0", className)}
    sandbox={TARGET_FRAME_SANDBOX}
    onLoad={onLoad}
  />
);

export default TargetFrame;
