import { quoteRoute } from "@evinvest/kitstart/next";
import { after } from "next/server";
import { TEXT } from "@/entities/content";
import { experimentSink, withExperimentLead, witnessedDefer } from "@/features/experiment/server";
import { notifier, serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";

/** The no-JS path: a plain form POST answered with a 303. */
export const dynamic = "force-dynamic";

const route = quoteRoute(site, {
  env: serverEnv,
  notifier,
  defer: witnessedDefer(after),
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
