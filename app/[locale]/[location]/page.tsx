import type { Metadata } from "next";
import { PlaceHome } from "@/views/home";
import { loadPlace, placePageMetadata } from "@/views/place/server";

type Props = { params: Promise<{ locale: string; location: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view, copy } = await loadPlace(params);
  return placePageMetadata(view, copy, "home");
}

export default async function PlaceHomePage({ params }: Props) {
  const { view, copy, renderedAt } = await loadPlace(params);
  return <PlaceHome view={view} copy={copy} renderedAt={renderedAt} />;
}
