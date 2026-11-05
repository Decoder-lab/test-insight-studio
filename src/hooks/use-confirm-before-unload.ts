import { useEffect } from "react";

/**
 * Asks the browser to confirm before the page is closed or reloaded while `active`. The invitation
 * token lives in memory only, and the link stops opening once the recording upload has started, so a
 * reload would end the respondent's test.
 */
export function useConfirmBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
