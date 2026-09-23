import { NextResponse, type NextRequest } from "next/server";
import { decide, LANG_COOKIE, LANG_COOKIE_MAX_AGE, LOCALE_HEADER } from "./decide";

/** The bare URL's answer depends on both; a shared cache must key on them. */
const VARY = "Accept-Language, Cookie";

/** `decide`, applied to a live request. */
export function routeRequest(request: NextRequest): NextResponse {
  const url = request.nextUrl;
  const decision = decide({
    pathname: url.pathname,
    query: url.searchParams,
    acceptLanguage: request.headers.get("accept-language"),
    cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
  });
  switch (decision.kind) {
    case "pass": {
      const headers = new Headers(request.headers);
      headers.delete(LOCALE_HEADER);
      if (decision.locale) headers.set(LOCALE_HEADER, decision.locale);
      return NextResponse.next({ request: { headers } });
    }
    case "negotiate": {
      const response = NextResponse.redirect(new URL(decision.location, url), 302);
      response.headers.set("Vary", VARY);
      return response;
    }
    case "choose": {
      const response = NextResponse.redirect(new URL(decision.location, url), 303);
      response.cookies.set(LANG_COOKIE, decision.locale, {
        path: "/",
        maxAge: LANG_COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: true,
      });
      return response;
    }
  }
}
