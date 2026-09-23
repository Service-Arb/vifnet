/** The container's readiness probe: the process answers. */
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response("ok", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
