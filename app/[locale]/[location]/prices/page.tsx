import type { Metadata } from "next";
import { pricing } from "@/shared/config/env";
import { loadPlace, placePageMetadata } from "@/views/place/server";
import { PlaceSubpage } from "@/views/subpage";

type Props = { params: Promise<{ locale: string; location: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view, copy } = await loadPlace(params);
  return placePageMetadata(view, copy, "prices");
}

export default async function PricesPage({ params }: Props) {
  // The price list the table starts each priced job at, live or baked: under ISR, read with the page.
  const [{ view, copy, renderedAt }, model] = await Promise.all([loadPlace(params), pricing.model()]);
  return <PlaceSubpage view={view} copy={copy} page="prices" renderedAt={renderedAt} pricing={model} />;
}
