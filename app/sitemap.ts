import type { MetadataRoute } from "next";
import { PLACE } from "@/entities/place";
import { sitemapFor } from "@/features/seo";
import { SITE } from "@/shared/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapFor(SITE, PLACE);
}
