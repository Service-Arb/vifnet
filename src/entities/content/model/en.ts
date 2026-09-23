import type { Text } from "./types";

// The French page's twin; the same rule — nothing the owner has not confirmed.
export const EN = {
  pages: {
    home: {
      title: "Vifnet — cleaning for homes and premises",
      description:
        "Vifnet cleans homes and premises: deep cleans, after building works, upholstery and outdoor areas. Site in preparation.",
    },
  },
  home: {
    eyebrow: "Site in preparation",
    h1: "Cleaning for homes and premises",
    lede: "Prices, the area we cover and how to reach us will be published here soon.",
    servicesEyebrow: "Services",
    servicesTitle: "What we clean",
  },
  services: {
    deep: { name: "Deep clean", body: "Kitchen, bathroom, floors and corners, thoroughly." },
    after_works: { name: "After building works", body: "The dust and marks that works leave behind." },
    upholstery: { name: "Upholstery", body: "Sofas, armchairs, mattresses and rugs." },
    exterior: { name: "Outdoor areas", body: "Terraces, paths and paving." },
    other: { name: "Something else", body: "A job that is not on this list." },
  },
  footer: { legal: "Legal notice in preparation." },
  notFound: {
    title: "Page not found",
    eyebrow: "Error 404",
    headline: ["This page", "does not exist"],
    body: "The address does not lead to any page on this site.",
    action: "Back to the home page",
  },
  langSwitchLabel: "Language",
} satisfies Text;
