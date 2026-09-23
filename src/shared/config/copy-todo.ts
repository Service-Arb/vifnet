import type { OwnerTodo } from "@evinvest/kitstart";
import type { Locale } from "./i18n";

/** An owner-unconfirmed term, and how it would read in each language. */
export interface CopyTodo extends OwnerTodo {
  /** Matches the term in the copy; `tests/content.test.ts` fails on a hit. */
  said: Readonly<Record<Locale, RegExp>>;
}

const term = (field: string, why: string, fr: RegExp, en: RegExp): CopyTodo => ({ field: `copy: ${field}`, why, blocksLaunch: false, said: { fr, en } });

/**
 * What the design says that the company would be held to, and the owner has
 * not confirmed (Figma note 9:529 and the review of vifnet#10). None of it is
 * on the page; each line says where it would go once confirmed.
 */
export const COPY_TODO: readonly CopyTodo[] = [
  term(
    "fixed price",
    "« prix ferme avant de venir / confirmé par écrit, ne change pas sur place » (hero, FAQ, how-it-works)",
    /prix ferme|par écrit|ne change pas/i,
    /fixed price|in writing|does not change/i,
  ),
  term("supplies", "« produits et matériel apportés par l’équipe » (hero, FAQ, how-it-works)", /produits et matériel|matériel|apporté/i, /equipment|supplies|products and/i),
  term("re-clean", "« signalez-le dans les 24 heures : l’équipe revient sans frais » (FAQ)", /24 ?h|sans frais|revient/i, /24 ?h|free of charge|comes back/i),
  term("keys", "« vous pouvez confier les clés » (FAQ)", /\bclés?\b/i, /\bkeys?\b/i),
  term(
    "offices",
    "« logements et locaux », « bureaux et commerces, tôt le matin ou après la fermeture » (title, hero, FAQ, footer): the photos show homes",
    /\blocaux\b|bureaux|commerces|tôt le matin|fermeture/i,
    /premises|\boffices?\b|\bshops?\b|at work|early morning|closing time/i,
  ),
  term(
    "methods",
    "four / réfrigérateur, injection-extraction, haute pression (service lines, FAQ)",
    /\bfour\b|réfrigérateur|injection|haute pression/i,
    /\boven\b|fridge|extraction|pressure/i,
  ),
  term("consent", "« rien n’est facturé sans votre accord » (closing, thank-you page)", /facturé|sans votre accord/i, /charged|without your (consent|agreement)/i),
  term("no retouching", "« sans retouche » (before/after headline)", /retouch/i, /retouch/i),
  term("taken on site", "« photos prises par l’équipe sur place » (before/after lede)", /prises par l.équipe|sur place/i, /taken by the team|on site/i),
  term(
    "joint check",
    "« vous vérifiez le résultat avec l’équipe avant son départ » (how-it-works step 3)",
    /vérifiez le résultat|avant son départ/i,
    /check the result|before it leaves/i,
  ),
  term("no sales calls", "« pas de démarchage » (under the form)", /démarchage/i, /sales calls?|cold call/i),
  term(
    "service types",
    "entretien régulier, fin de bail, fin de chantier (services, form, prices) — see SUBJECTS",
    /entretien régulier|fin de bail|fin de chantier|travaux/i,
    /regular cleaning|end of tenancy|building works|after works/i,
  ),
];
