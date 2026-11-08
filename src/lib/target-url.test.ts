import { describe, expect, it } from "vitest";
import { checkTargetUrl, isTargetUrl, MAX_TARGET_URL_LENGTH } from "./target-url";

describe("checkTargetUrl", () => {
  it.each([
    "https://example.com",
    "https://example.com/pricing?plan=pro#top",
    "https://example.com:8443/app",
    "https://sub.example.co.uk/a/b",
    "https://192.168.0.10/",
    "https://example.com?x=1",
    `https://example.com/${"a".repeat(MAX_TARGET_URL_LENGTH - "https://example.com/".length)}`,
  ])("accepts %s", (value) => {
    expect(checkTargetUrl(value)).toBeNull();
  });

  it.each([
    ["", "Enter the page's address"],
    ["http://example.com", "Start the address with https://"],
    ["example.com", "Start the address with https://"],
    ["//example.com", "Start the address with https://"],
    ["/pricing", "Start the address with https://"],
    ["javascript:alert(1)", "Start the address with https://"],
    ["data:text/html,<p>hi</p>", "Start the address with https://"],
    // `new URL` would lowercase the scheme, so only the raw string tells these apart.
    ["HTTPS://example.com", "Start the address with https://"],
    ["Https://example.com", "Start the address with https://"],
    ["https://", "Enter a host name after https://"],
    ["https:///path", "Enter a host name after https://"],
    ["https://?q=1", "Enter a host name after https://"],
    ["https://user:pass@example.com/", "The address must not contain a user name or password"],
    // `new URL` reports an empty user name for this one.
    ["https://@example.com/", "The address must not contain a user name or password"],
    ["https://example.com@evil.com/", "The address must not contain a user name or password"],
    ["https://example.com\\@evil.com/", "The address must not contain spaces, line breaks or backslashes"],
    ["https://exa mple.com", "The address must not contain spaces, line breaks or backslashes"],
    // `new URL` silently drops these two.
    ["https://example.com/a\nb", "The address must not contain spaces, line breaks or backslashes"],
    ["https://example.com/a\tb", "The address must not contain spaces, line breaks or backslashes"],
    ["https://example.com/ ", "The address must not contain spaces, line breaks or backslashes"],
    ["https://example.com/\u0000", "The address must not contain spaces, line breaks or backslashes"],
    [" https://example.com", "The address must not contain spaces, line breaks or backslashes"],
    ["https://example.com:99999/", "This is not a valid address"],
    ["https://:443/", "This is not a valid address"],
    [`https://example.com/${"a".repeat(MAX_TARGET_URL_LENGTH)}`, `Use at most ${MAX_TARGET_URL_LENGTH} characters`],
  ])("rejects %j", (value, message) => {
    expect(checkTargetUrl(value)).toBe(message);
  });
});

describe("the characters it refuses", () => {
  // The backend's class, copied from `TARGET_URL_FORBIDDEN_CHARACTERS` (supabase/functions/_shared/target_url.ts in
  // the backend repository). If the backend changes it, this test is where the two are brought together again.
  // eslint-disable-next-line no-control-regex -- the control range is the point of this test
  const BACKEND_FORBIDDEN = new RegExp("[\\u0000-\\u0020\\u007f-\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff\\\\]");
  const MESSAGE = "The address must not contain spaces, line breaks or backslashes";

  it("are exactly the ones the backend refuses, for every UTF-16 code unit", () => {
    const disagreements: string[] = [];
    for (let code = 0; code <= 0xffff; code++) {
      const forbidden = BACKEND_FORBIDDEN.test(String.fromCharCode(code));
      const refused = checkTargetUrl(`https://example.com/${String.fromCharCode(code)}`) === MESSAGE;
      if (forbidden !== refused) disagreements.push(`U+${code.toString(16).padStart(4, "0")}`);
    }

    expect(disagreements).toEqual([]);
  });

  it.each(["\u0080", "\u0085", "\u009f", "\u00a0"])("refuses %j, also inside the host", (character) => {
    expect(checkTargetUrl(`https://example.com/${character}`)).toBe(MESSAGE);
    expect(checkTargetUrl(`https://exa${character}mple.com/`)).toBe(MESSAGE);
  });
});

describe("isTargetUrl", () => {
  it("is false for anything that is not an acceptable string", () => {
    expect(isTargetUrl("https://example.com")).toBe(true);
    expect(isTargetUrl("http://example.com")).toBe(false);
    expect(isTargetUrl(undefined)).toBe(false);
    expect(isTargetUrl(null)).toBe(false);
    expect(isTargetUrl(42)).toBe(false);
  });
});
