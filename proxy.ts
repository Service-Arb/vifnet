import type { NextRequest } from "next/server";
import { routeRequest } from "@/features/locale-routing";

export function proxy(request: NextRequest) {
  return routeRequest(request);
}

export const config = {
  // Everything but the build's static chunks, whose misses Next answers with a
  // bare 404 rather than the 404 page. Any wider exclusion (a path with an
  // extension, `_next/image` — unused, `images.unoptimized` — or all of
  // `_next/`) renders `global-not-found.tsx` without the proxy having rewritten
  // `LOCALE_HEADER`, and the client would choose its language.
  // `decide` owns the list of what is a page and passes the rest through.
  matcher: ["/((?!_next/static/).*)"],
};
