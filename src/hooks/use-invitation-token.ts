import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { parseInvitationToken } from "@/lib/respondent-link";

/**
 * Takes the invitation token from the URL fragment (`#invite=<token>`), keeps it in memory, and
 * removes the fragment from the address bar and the current history entry (the contract asks the
 * frontend to do this right after reading it). A new link opened in the same tab replaces the token.
 * A refresh loses it, so the respondent reopens the link from the invitation.
 *
 * The token is a password: it is never stored, logged or rendered.
 */
export function useInvitationToken(): string | null {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const fromUrl = parseInvitationToken(hash);
  const [kept, setKept] = useState(fromUrl);

  useEffect(() => {
    if (!fromUrl) return;
    setKept(fromUrl);
    navigate({ pathname, search }, { replace: true });
  }, [fromUrl, pathname, search, navigate]);

  // `fromUrl` first, so a token that has just arrived is used in the same render.
  return fromUrl ?? kept;
}
