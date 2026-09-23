import type { Text } from "./types";

// A placeholder page while the site is built: it names the trade and nothing
// the owner has not confirmed — no price, no area, no number (OWNER_TODO).
export const FR = {
  pages: {
    home: {
      title: "Vifnet — nettoyage de logements et de locaux",
      description:
        "Vifnet nettoie logements et locaux : grand ménage, fin de chantier, textiles et extérieurs. Site en préparation.",
    },
  },
  home: {
    eyebrow: "Site en préparation",
    h1: "Nettoyage de logements et de locaux",
    lede: "Les tarifs, la zone d’intervention et les moyens de nous joindre seront publiés ici prochainement.",
    servicesEyebrow: "Prestations",
    servicesTitle: "Ce que nous nettoyons",
  },
  services: {
    deep: { name: "Grand ménage", body: "Cuisine, salle de bain, sols et recoins, à fond." },
    after_works: { name: "Fin de chantier", body: "Poussière et traces laissées par des travaux." },
    upholstery: { name: "Textiles", body: "Canapés, fauteuils, matelas et tapis." },
    exterior: { name: "Extérieurs", body: "Terrasses, allées et pavés." },
    other: { name: "Autre demande", body: "Un besoin qui n’est pas dans la liste." },
  },
  footer: { legal: "Mentions légales en cours de rédaction." },
  notFound: {
    title: "Page introuvable",
    eyebrow: "Erreur 404",
    headline: ["Cette page", "n’existe pas"],
    body: "L’adresse ne mène à aucune page du site.",
    action: "Retour à l’accueil",
  },
  langSwitchLabel: "Langue",
} satisfies Text;
