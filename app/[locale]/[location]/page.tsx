import type { Metadata } from "next";
import { PlaceHome } from "@/views/home";
import { loadPlace, placePageMetadata } from "@/views/place/server";
import { pricing, serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { parseLocation } from "@/shared/lib/experiments";

type Props = { params: Promise<{ locale: string; location: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view, copy } = await loadPlace(params);
  return placePageMetadata(view, copy, "home");
}

export default async function PlaceHomePage({ params }: Props) {
  // The price list the card prices from, live or baked: under ISR, read with the page.
  const [{ view, copy, renderedAt }, model] = await Promise.all([loadPlace(params), pricing.model()]);
  // The bucket rides in the param (the proxy's rewrite, under the panel's
  // overrides), so each is its own ISR entry and the page never asks the panel.
  const bucket = parseLocation((await params).location)?.bucket ?? {};
  const env = serverEnv();
  const target = { key: env.posthogKey, host: env.posthogHost, brandId: site.brand.id };
  return <PlaceHome view={view} copy={copy} renderedAt={renderedAt} pricing={model} experiments={{ bucket, target }} />;
}
