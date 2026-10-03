import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AnalyticsSink } from "@evinvest/analytics";
import { EXPERIMENT_EVENTS, type LiveExperiments } from "@/shared/config/experiments";
import { assignedBy } from "@/shared/lib/experiments";

export { experimentSink } from "./model/events";

type Defer = (task: () => Promise<void> | void) => void;

/** One per request: did kitstart's funnel accept this one as a lead? */
const accepted = new AsyncLocalStorage<{ lead: boolean }>();

/**
 * kitstart's `defer` with a witness. The funnel defers work (the owner's
 * notification, `lead_form_submit`) only for a lead it stored and does not
 * suspect — never for a validation failure, a honeypot or the rate limit — so
 * a deferral is the one outside sign that the request was a real lead.
 */
export function witnessedDefer(defer: Defer): Defer {
  return task => {
    const state = accepted.getStore();
    if (state) state.lead = true;
    defer(task);
  };
}

function cookieReader(header: string | null): (name: string) => string | undefined {
  const jar = new Map<string, string>();
  for (const pair of (header ?? "").split(";")) {
    const at = pair.indexOf("=");
    if (at > 0) jar.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
  }
  return name => jar.get(name);
}

/**
 * `/quote` with `experiment_lead`: once kitstart has accepted the lead, one
 * event per experiment the visitor's `ab_<key>` cookies put them in, after
 * the response. Both the no-JS POST and the card's `fetch` land here with the
 * cookies, so both count; a request with no cookie (a bot posting straight
 * here) is in no experiment. The cookies are read under the live config
 * (`experiments`, the proxy's), so a test the panel switched off counts no
 * lead. The route must be built with {@link witnessedDefer}.
 */
export function withExperimentLead(
  route: (request: Request) => Promise<Response>,
  deps: { sink: () => AnalyticsSink; defer: Defer; experiments: () => Promise<LiveExperiments> },
): (request: Request) => Promise<Response> {
  return async request => {
    const state = { lead: false };
    const response = await accepted.run(state, () => route(request));
    if (state.lead) {
      const { assigned, forced } = assignedBy(await deps.experiments(), cookieReader(request.headers.get("cookie")));
      const entries = Object.entries(assigned);
      if (entries.length) {
        deps.defer(() => {
          const sink = deps.sink();
          for (const [experiment, variant] of entries) sink.capture(EXPERIMENT_EVENTS.lead, { experiment, variant, forced });
        });
      }
    }
    return response;
  };
}
