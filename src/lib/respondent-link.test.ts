import { describe, expect, it } from "vitest";
import { buildInvitationLink } from "./respondent-link";

describe("buildInvitationLink", () => {
  it("puts the token in the URL fragment of the /test page", () => {
    expect(buildInvitationLink("abc_DEF-123", "https://app.example")).toBe("https://app.example/test#invite=abc_DEF-123");
  });

  it("never puts the token in the path or the query string", () => {
    const url = new URL(buildInvitationLink("s3cr3t-token", "https://app.example"));

    expect(url.hash).toBe("#invite=s3cr3t-token");
    expect(url.search).toBe("");
    expect(url.pathname).toBe("/test");
    expect(url.pathname).not.toContain("s3cr3t-token");
  });

  it.each(["a+b/c=", "a#b c%d", "a&b=c", "ü?x"])("lets the respondent page read back the token %j unchanged", (token) => {
    const url = new URL(buildInvitationLink(token, "https://app.example"));

    expect(url.search).toBe("");
    expect(new URLSearchParams(url.hash.slice(1)).get("invite")).toBe(token);
  });

  it("uses the current origin by default", () => {
    expect(buildInvitationLink("tok")).toBe(`${window.location.origin}/test#invite=tok`);
  });
});
