/**
 * Where a respondent opens their invitation link: the respondent entry page.
 * Today `/test` is served by a placeholder page; the real respondent flow will replace it.
 */
export const RESPONDENT_PATH = "/test";

/** Name of the fragment parameter that carries the token: `#invite=<token>`. */
export const INVITATION_PARAM = "invite";

/**
 * Builds the shareable link `<origin><RESPONDENT_PATH>#invite=<token>`.
 * The token travels in the URL fragment, which browsers never send to servers; it must not
 * be placed in the path or the query string.
 *
 * The fragment is `key=value`, so the respondent page reads it with `URLSearchParams`. The token
 * is therefore always percent-encoded (a no-op for base64url tokens): an unescaped `+` would be
 * read back as a space and an `&` would cut the value short.
 */
export function buildInvitationLink(token: string, origin: string = window.location.origin): string {
  return `${origin}${RESPONDENT_PATH}#${INVITATION_PARAM}=${encodeURIComponent(token)}`;
}
