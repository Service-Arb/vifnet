import type { NextRequest } from "next/server";
import { routeRequest } from "@/features/locale-routing";

export function proxy(request: NextRequest) {
  return routeRequest(request);
}

export const config = {
  // Everything but the build output and files with an extension; `decide`
  // owns the list of what is a page and passes the rest through.
  matcher: ["/((?!_next/|.*\\.[a-z0-9]+$).*)"],
};
