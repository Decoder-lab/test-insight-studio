/**
 * The rule for a project's target URL (`TargetUrl` in contracts/openapi.yaml): the page a respondent
 * browses in an iframe while recording. The backend applies the same rule after trimming; this check is
 * at least as strict, so a value that passes here is never answered with a `400`.
 *
 * The characters it refuses are exactly the backend's (`TARGET_URL_FORBIDDEN_CHARACTERS` in the backend's
 * `_shared/target_url.ts`): U+0000 to U+0020, U+007F to U+00A0 (C0 and C1 controls, space, DEL, NBSP),
 * the other Unicode space separators, the line and paragraph separators, the BOM and the backslash.
 *
 * It works on the raw string on purpose. `new URL` is too lenient for this: it lowercases `HTTPS://`,
 * accepts `https://@host/` and `https:///path` (host `path`), silently drops tabs and line breaks and
 * reads `example.com\@evil.com` as host `example.com`.
 */

export const MAX_TARGET_URL_LENGTH = 2048;

const SCHEME = "https://";

// Not one regular expression: ESLint's `no-control-regex` forbids the control ranges in a pattern.
// `\s` is JavaScript's whitespace (what `trim()` removes): space, NBSP, U+1680, U+2000-U+200A, U+2028,
// U+2029, U+202F, U+205F, U+3000 and the BOM. The controls come on top of that.
const hasForbiddenCharacter = (value: string) => {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f) || character === "\\" || /\s/.test(character)) return true;
  }
  return false;
};

/**
 * @param value The address as it will be sent: already trimmed (an empty string is "not entered").
 * @returns A message for the administrator, or `null` when the address is acceptable.
 */
export function checkTargetUrl(value: string): string | null {
  if (value === "") return "Enter the page's address";
  if (value.length > MAX_TARGET_URL_LENGTH) return `Use at most ${MAX_TARGET_URL_LENGTH} characters`;
  if (hasForbiddenCharacter(value)) return "The address must not contain spaces, line breaks or backslashes";
  if (!value.startsWith(SCHEME)) return "Start the address with https://";

  const authority = value.slice(SCHEME.length).split(/[/?#]/, 1)[0];
  if (authority === "") return "Enter a host name after https://";
  if (authority.includes("@")) return "The address must not contain a user name or password";

  try {
    if (new URL(value).hostname === "") return "Enter a host name after https://";
  } catch {
    return "This is not a valid address";
  }
  return null;
}

export const isTargetUrl = (value: unknown): value is string => typeof value === "string" && checkTargetUrl(value) === null;
