import type { StatusCopy } from "@evinvest/kitstart";
import type { Facts, Text } from "./types";

const status = (
  code: string,
  title: string,
  eyebrow: string,
  headline: readonly [string, string],
  body: string,
  primary: StatusCopy<Facts>["primary"],
): StatusCopy<Facts> => ({ code, title, eyebrow, headline, body: () => body, primary, secondary: "home" });

// The French page's twin, under the same rule: no term the owner has not confirmed.
export const EN = {
  pages: {
    home: {
      title: () => "Vifnet — home cleaning",
      description: () =>
        "Deep cleans, upholstery and outdoor areas, at your place. Describe the job in a minute: we call you back.",
    },
  },
  quoteForm: {
    title: "Get your quote.",
    lede: "Four fields, one minute.",
    submit: "Get my quote",
    privacy: "Your number is used for this request only.",
    reassurance: () => "We call you back on the number you give.",
    honeypotLabel: "Website",
  },
  notFound: status(
    "404",
    "Page not found",
    "Error 404",
    ["This page ", "does not exist."],
    "The address leads to no page of this site. The quote is still one click away.",
    "home",
  ),
  serverError: status("500", "Error", "Error 500", ["Something broke ", "on our side."], "Try again in a moment.", "retry"),
  thanks: status(
    "✓",
    "Request received",
    "Request sent",
    ["Thank you, ", "it’s in."],
    "We call you back on the number you gave to agree on the price and the time.",
    "home",
  ),
  callLabel: f => (f.phone ? `Call ${f.phone}` : "Call us"),
  whatsappLabel: "WhatsApp",
  whatsappShort: "WhatsApp",
  whatsappMessage: () => "Hello, I am writing from the Vifnet site.",
  ctaShort: "Get a quote",
  backHome: "Back to the home page",
  tryAgain: "Try again",
  statusStrip: [],
  langName: "English",
  facts: () => ["Vifnet", "Legal notice in preparation"],
  header: { cta: "Get a quote", ctaCompact: "Get a quote", home: "Vifnet — home" },
  nav: { services: "Services", work: "Before / after", steps: "How it works", faq: "FAQ", menu: "Menu" },
  hero: {
    title: ["Cleaning done ", "thoroughly", ", at your place."],
    lede: "Deep cleans, upholstery or outdoor areas, in your house or flat. Describe the job in a minute: we call you back.",
    toWork: "See before / after ↓",
  },
  beforeAfter: {
    eyebrow: "Our work",
    title: "Before, after.",
    lede: "Drag the handle to compare.",
    before: "Before",
    after: "After",
    slider: "Compare before and after",
    position: "Before {n} %",
    picker: "Choose a job",
    pairs: {
      sofa: "Corner sofa — upholstery cleaning",
      bathtub: "Bathtub — deep clean",
      carpet: "Fitted carpet — upholstery cleaning",
      driveway: "Paved driveway — outdoor areas",
      mattress: "Mattress — upholstery cleaning",
      recliner: "Armchair — upholstery cleaning",
    },
  },
  services: {
    eyebrow: "What we do",
    title: "What we clean",
    lede: "Pick a type: the form opens already filled in.",
    onQuote: "On quote",
    ask: "Ask for this quote →",
    items: {
      deep: { name: "Deep clean", body: "Kitchen, bathroom, floors and corners, thoroughly.", photoAlt: "The kitchen of a Paris flat" },
      upholstery: { name: "Upholstery", body: "Sofas, armchairs, mattresses and rugs.", photoAlt: "An upholstery cleaning machine in front of a sofa" },
      exterior: { name: "Outdoor areas", body: "Terraces, paths and paving.", photoAlt: "Cleaning a gravel terrace" },
      other: { name: "Something else", body: "A job that is not on this list? Describe it.", photoAlt: "Cleaning a mirror in a gilded salon" },
    },
  },
  priceTable: {
    title: "Prices",
    lede: "Prices include VAT.",
    service: "Service",
    price: "Price incl. VAT",
    detail: {
      deep: "per visit, by surface",
      upholstery: "sofa, mattress or rug, per piece",
      exterior: "per m²",
      other: "on quote",
    },
  },
  howItWorks: {
    eyebrow: "In three steps",
    title: "How it works",
    steps: [
      { title: "You describe the job", body: "Type of cleaning, surface, town and a number: the form takes a minute." },
      { title: "We call you back", body: "We ask what matters and agree the price and the time with you." },
      { title: "The team comes", body: "The team comes to your place at the agreed time." },
    ],
  },
  reviews: { title: "Reviews", summary: (value, count) => `Google rating ${value} / 5 — ${count} reviews` },
  serviceArea: {
    title: "We come to you",
    lede: "Nowhere to visit: the team travels to the towns listed here. Yours is not there? Ask all the same.",
  },
  faqEyebrow: "Good to know",
  faqTitle: "Questions",
  faqs: [
    {
      q: "How is the price set?",
      a: "By the type of cleaning, the surface and the state of the place. Describe the job in the form: we call you back with a price.",
    },
    {
      q: "What kinds of cleaning do you do?",
      a: "Deep cleans, upholstery (sofas, armchairs, mattresses, rugs) and outdoor areas (terraces, paths, paving). For anything else, describe the job.",
    },
  ],
  closing: {
    title: "Get your quote.",
    lede: "Four fields, one minute. We call you back to agree the price and the time.",
  },
  subjects: {
    deep: "Deep clean",
    upholstery: "Upholstery",
    exterior: "Outdoor areas",
    other: "Something else",
  },
  quoteLabels: {
    subject: "Type of cleaning",
    choose: "Choose…",
    surface: "Surface (m²)",
    surfaceHint: "e.g. 65",
    locality: "Town",
    localityHint: "Town or postcode",
    mobile: "Phone",
    mobileHint: "06 12 34 56 78",
    callback: "We call you back to agree the price and the time.",
  },
  footer: {
    tagline: "Home cleaning, house or flat.",
    legal: "Legal notice (in preparation)",
    copyright: year => `© ${year} Vifnet`,
  },
  brandPage: { title: "Vifnet", description: "Home cleaning.", open: "Open" },
  contactLabel: "Contact us",
  langLabel: "Language",
} satisfies Text;
