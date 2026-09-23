import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copyFor } from "@/entities/content";
import { PLACE } from "@/entities/place";
import { pageMetadata } from "@/features/seo";
import { isLocale } from "@/shared/config/i18n";
import { SITE } from "@/shared/config/site";
import { HomeView } from "@/views/home";

type Props = { params: Promise<{ locale: string }> };

async function copyOf(params: Props["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return copyFor(locale);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata(SITE, PLACE, await copyOf(params), "home");
}

export default async function HomePage({ params }: Props) {
  return <HomeView copy={await copyOf(params)} />;
}
