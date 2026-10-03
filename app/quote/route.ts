import { quoteRoute } from "@evinvest/kitstart/next";
import { after } from "next/server";
import { TEXT } from "@/entities/content";
import { experimentSink, withExperimentLead, witnessedDefer } from "@/features/experiment/server";
import { notifier, serverEnv, webhook } from "@/shared/config/env";
import { ANCHORS } from "@/shared/config/nav";
import { site } from "@/shared/config/site";

/** The no-JS path: a plain form POST answered with a 303. */
export const dynamic = "force-dynamic";

const route = quoteRoute(site, {
  env: serverEnv,
  notifier,
  webhook,
  defer: witnessedDefer(after),
  // A refusal lands back on the card. LeadCapture posts its id (`card`) too;
  // this covers a post without it — a page cached before kitstart 0.9.0.
  anchor: ANCHORS.quote,
  unavailable: locale => {
    const t = TEXT[locale];
    const f = { place: site.brand.name, phone: site.brand.phone };
    return { title: t.serverError.title, heading: t.serverError.headline.join(""), body: t.serverError.body(f), callLabel: t.callLabel(f) };
  },
});

export const POST = withExperimentLead(route, {
  defer: after,
  sink: () => {
    const env = serverEnv();
    return experimentSink({ key: env.posthogKey, host: env.posthogHost, brandId: site.brand.id }, null);
  },
});
