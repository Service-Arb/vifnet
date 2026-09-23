import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, LOCALES } from "@/shared/config/i18n";
import { SITE } from "@/shared/config/site";
import { siteOrigin } from "@/shared/landing";

/**
 * The root layout lives under `[locale]` so `<html lang>` is the page's own
 * language on the first byte — both languages are prefixed, so every page has
 * one. The brand scope and the light polarity sit on `<html>`: overlays portal
 * to `body` and stay inside both without a provider.
 */
const origin = siteOrigin(SITE);

export const metadata: Metadata = {
  ...(origin === null ? {} : { metadataBase: new URL(origin) }),
  applicationName: SITE.brand.name,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Any other first segment is not a route at all, so it reaches
// `global-not-found.tsx` instead of failing inside this layout.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} data-brand={SITE.brand.id} className="light">
      <body>{children}</body>
    </html>
  );
}
