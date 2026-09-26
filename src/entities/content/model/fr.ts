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

// The copy of the Figma frames (11BVyibSdB8fBYrfBiLX3C), less every line that
// promises a term the owner has not confirmed (OWNER_TODO, "copy:").
export const FR = {
  pages: {
    home: {
      title: () => "Vifnet — ménage à domicile",
      description: () =>
        "Grand ménage, textiles et extérieurs, chez vous. Décrivez le besoin en une minute : nous vous rappelons.",
    },
  },
  quoteForm: {
    title: "Recevez votre devis.",
    lede: "Quatre champs, une minute.",
    submit: "Recevoir mon devis",
    privacy: "Votre numéro ne sert qu’à cette demande.",
    reassurance: () => "Nous vous rappelons au numéro indiqué.",
    honeypotLabel: "Site web",
  },
  notFound: status(
    "404",
    "Page introuvable",
    "Erreur 404",
    ["Cette page ", "n’existe pas."],
    "L’adresse ne mène à aucune page du site. Le devis, lui, est toujours à un clic.",
    "home",
  ),
  serverError: status("500", "Erreur", "Erreur 500", ["Un problème ", "de notre côté."], "Réessayez dans un instant.", "retry"),
  thanks: status(
    "✓",
    "Demande reçue",
    "Demande envoyée",
    ["Merci, ", "c’est bien reçu."],
    "Nous vous rappelons au numéro indiqué pour convenir du prix et du créneau.",
    "home",
  ),
  callLabel: f => (f.phone ? `Appeler le ${f.phone}` : "Nous appeler"),
  whatsappLabel: "WhatsApp",
  whatsappShort: "WhatsApp",
  whatsappMessage: () => "Bonjour, je vous contacte depuis le site Vifnet.",
  ctaShort: "Demander un devis",
  backHome: "Retour à l’accueil",
  tryAgain: "Réessayer",
  statusStrip: [],
  langName: "Français",
  facts: () => ["Vifnet", "Mentions légales en cours de rédaction"],
  header: { cta: "Demander un devis", ctaCompact: "Devis", home: "Vifnet — accueil" },
  nav: { services: "Prestations", work: "Avant / après", steps: "Étapes", faq: "FAQ", menu: "Menu" },
  hero: {
    title: ["Le ménage fait ", "à fond", ", chez vous."],
    lede: "Grand ménage, textiles ou extérieurs, à la maison ou dans l’appartement. Décrivez le besoin en une minute : nous vous rappelons.",
    toWork: "Voir avant / après ↓",
  },
  beforeAfter: {
    eyebrow: "Nos réalisations",
    title: "Avant, après.",
    lede: "Faites glisser la poignée pour comparer.",
    before: "Avant",
    after: "Après",
    slider: "Comparer avant et après",
    position: "Avant {n} %",
    picker: "Choisir une intervention",
    pairs: {
      sofa: "Canapé d’angle — nettoyage des textiles",
      bathtub: "Baignoire — grand ménage",
      carpet: "Moquette — nettoyage des textiles",
      driveway: "Allée pavée — extérieurs",
      mattress: "Matelas — nettoyage des textiles",
      recliner: "Fauteuil — nettoyage des textiles",
    },
  },
  services: {
    eyebrow: "Nos prestations",
    title: "Ce que nous nettoyons",
    lede: "Choisissez un type : le formulaire s’ouvre déjà rempli.",
    onQuote: "Sur devis",
    ask: "Demander ce devis →",
    items: {
      deep: { name: "Grand ménage", body: "Cuisine, salle de bain, sols et recoins, à fond.", photoAlt: "Cuisine d’un appartement parisien" },
      upholstery: { name: "Textiles", body: "Canapés, fauteuils, matelas et tapis.", photoAlt: "Machine de nettoyage des textiles devant un canapé" },
      exterior: { name: "Extérieurs", body: "Terrasses, allées et pavés.", photoAlt: "Nettoyage d’une terrasse gravillonnée" },
      other: { name: "Autre demande", body: "Un besoin qui n’est pas dans la liste ? Décrivez-le.", photoAlt: "Nettoyage d’un miroir dans un salon doré" },
    },
  },
  priceTable: {
    title: "Tarifs",
    lede: "Prix TTC.",
    service: "Prestation",
    price: "Prix TTC",
    detail: {
      deep: "par intervention, selon la surface",
      upholstery: "canapé, matelas ou tapis, à la pièce",
      exterior: "par m²",
      other: "sur devis",
    },
  },
  howItWorks: {
    eyebrow: "En trois étapes",
    title: "Comment ça se passe",
    steps: [
      { title: "Vous décrivez le besoin", body: "Type de ménage, surface, ville et un numéro : le formulaire prend une minute." },
      { title: "Nous vous rappelons", body: "Nous posons les questions utiles et convenons avec vous du prix et du créneau." },
      { title: "L’équipe intervient", body: "L’équipe vient chez vous au créneau convenu." },
    ],
  },
  reviews: { title: "Avis clients", summary: (value, count) => `Note Google ${value} / 5 — ${count} avis` },
  serviceArea: {
    title: "Nous venons chez vous",
    lede: "Pas d’agence à visiter : l’équipe se déplace dans les communes ci-contre. Votre ville n’y est pas ? Demandez quand même.",
  },
  faqEyebrow: "Bon à savoir",
  faqTitle: "Questions fréquentes",
  faqs: [
    {
      q: "Comment le prix est-il fixé ?",
      a: "D’après le type de ménage, la surface et l’état des lieux. Décrivez le besoin dans le formulaire : nous vous rappelons avec un prix.",
    },
    {
      q: "Quels types de ménage faites-vous ?",
      a: "Le grand ménage, les textiles (canapés, fauteuils, matelas, tapis) et les extérieurs (terrasses, allées, pavés). Pour autre chose, décrivez le besoin.",
    },
  ],
  closing: {
    title: "Recevez votre devis.",
    lede: "Quatre champs, une minute. Nous vous rappelons pour convenir du prix et du créneau.",
  },
  subjects: {
    deep: "Grand ménage",
    upholstery: "Textiles",
    exterior: "Extérieurs",
    other: "Autre demande",
  },
  quoteLabels: {
    subject: "Type de ménage",
    choose: "Choisir…",
    surface: "Surface (m²)",
    surfaceHint: "ex. 65",
    locality: "Ville",
    localityHint: "Ville ou code postal",
    mobile: "Téléphone",
    mobileHint: "06 12 34 56 78",
    callback: "Nous vous rappelons pour convenir du prix et du créneau.",
  },
  footer: {
    legal: "Mentions légales (en cours de rédaction)",
    copyright: year => `© ${year} Vifnet`,
  },
  brandPage: { title: "Vifnet", description: "Ménage à domicile.", open: "Ouvrir" },
  contactLabel: "Nous contacter",
  langLabel: "Langue",
} satisfies Text;
