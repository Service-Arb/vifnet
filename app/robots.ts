import type { MetadataRoute } from "next";
import { robotsFor } from "@/features/seo";
import { SITE } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(SITE);
}
