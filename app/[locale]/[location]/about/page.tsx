import type { Metadata } from "next";
import { loadPlace, placePageMetadata } from "@/views/place/server";
import { PlaceSubpage } from "@/views/subpage";

type Props = { params: Promise<{ locale: string; location: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view, copy } = await loadPlace(params);
  return placePageMetadata(view, copy, "about");
}

export default async function AboutPage({ params }: Props) {
  const { view, copy, renderedAt } = await loadPlace(params);
  return <PlaceSubpage view={view} copy={copy} page="about" renderedAt={renderedAt} />;
}
