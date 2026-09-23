import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { decide, LANG_COOKIE, LOCALE_HEADER, routeRequest } from "@/features/locale-routing";

const facts = (path: string, acceptLanguage: string | null = null, cookieLang: string | null = null) => {
  const url = new URL(path, "http://vifnet.test");
  return { pathname: url.pathname, query: url.searchParams, acceptLanguage, cookieLang };
};

describe("decide", () => {
  it.each([
    ["the bare URL, English browser", facts("/", "en-GB,en;q=0.9"), { kind: "negotiate", location: "/en" }],
    ["the bare URL, no header", facts("/"), { kind: "negotiate", location: "/fr" }],
    ["the bare URL, cookie beats the header", facts("/", "en", "fr"), { kind: "negotiate", location: "/fr" }],
    ["the bare URL keeps its query", facts("/?utm=x", "en"), { kind: "negotiate", location: "/en?utm=x" }],
    ["?lang= on a page", facts("/fr?lang=en&utm=x"), { kind: "choose", locale: "en", location: "/en?utm=x" }],
    ["?lang= on the bare URL", facts("/?lang=fr", "en"), { kind: "choose", locale: "fr", location: "/fr" }],
    ["?lang=xx is ignored", facts("/fr?lang=xx"), { kind: "pass", locale: "fr" }],
    ["a prefixed page", facts("/en"), { kind: "pass", locale: "en" }],
    ["a prefixed non-page", facts("/fr/nope.php"), { kind: "pass", locale: "fr" }],
    ["an unprefixed non-page", facts("/wp-login.php", "en"), { kind: "pass", locale: null }],
  ])("%s", (_, input, expected) => {
    expect(decide(input)).toEqual(expected);
  });
});

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, "http://vifnet.test"), { headers });

/** The request headers `NextResponse.next({ request })` hands on to the route. */
const forwarded = (response: Response, name: string): string | null => {
  const overridden = response.headers.get("x-middleware-override-headers")?.split(",") ?? [];
  return overridden.includes(name) ? response.headers.get(`x-middleware-request-${name}`) : null;
};

describe("routeRequest", () => {
  it("answers the bare URL with a 302 that varies on language and cookie", () => {
    const response = routeRequest(request("/", { "accept-language": "en" }));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://vifnet.test/en");
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
  });

  it("answers ?lang= with a 303 and a year-long, http-only cookie", () => {
    const response = routeRequest(request("/fr?lang=en"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://vifnet.test/en");
    const cookie = response.cookies.get(LANG_COOKIE);
    expect(cookie).toMatchObject({ value: "en", maxAge: 31_536_000, httpOnly: true, secure: true, sameSite: "lax" });
  });

  it("does not redirect or set a cookie for ?lang=xx", () => {
    const response = routeRequest(request("/fr?lang=xx"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(LANG_COOKIE)).toBeUndefined();
  });

  it("replaces a client-sent locale header with the path's language", () => {
    const response = routeRequest(request("/fr/nope.php", { [LOCALE_HEADER]: "en" }));
    expect(forwarded(response, LOCALE_HEADER)).toBe("fr");
  });

  it("drops a client-sent locale header on a path without a language", () => {
    const response = routeRequest(request("/wp-login.php", { [LOCALE_HEADER]: "en" }));
    expect(response.headers.get("x-middleware-override-headers")).not.toBeNull();
    expect(forwarded(response, LOCALE_HEADER)).toBeNull();
  });
});
