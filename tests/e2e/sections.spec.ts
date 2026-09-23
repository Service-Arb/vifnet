import { expect, test } from "@playwright/test";
import { defineSectionSuite } from "@evinvest/kitstart/testing/e2e";

// One visual baseline per section at both breakpoints, named like the Figma
// frames (widgets/…); adding a section is one line. Each is reached by a `#`
// the site links to, never by scrolling. Bands with no owner facts yet
// (prices, reviews, service area) render nothing and have no line here.
defineSectionSuite({ test, expect }, [
  { name: "header", url: "/fr", selector: "header >> nth=0" },
  { name: "hero", url: "/fr", selector: "main > section >> nth=0" },
  { name: "before-after", url: "/fr#avant-apres", selector: "#avant-apres" },
  { name: "services", url: "/fr#prestations", selector: "#prestations" },
  { name: "how-it-works", url: "/fr#etapes", selector: "#etapes" },
  { name: "faq", url: "/fr#faq", selector: "#faq" },
  { name: "closing", url: "/fr#devis", selector: "#devis" },
  { name: "footer", url: "/fr#footer", selector: "footer#footer" },
  { name: "callbar", url: "/fr", selector: "#callbar", mobileOnly: true, bare: true },
  { name: "thanks", url: "/fr/thanks", selector: "body" },
  { name: "not-found", url: "/fr/nope", selector: "body" },
]);
