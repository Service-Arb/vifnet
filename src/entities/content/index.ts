import type { Locale } from "@/shared/config/i18n";
import { EN } from "./model/en";
import { FR } from "./model/fr";
import type { Copy, Facts, Text } from "./model/types";

export type { Copy, Facts, Text } from "./model/types";

export const TEXT: Readonly<Record<Locale, Text>> = { fr: FR, en: EN };

export function copyFor(locale: Locale, f: Facts): Copy {
  return { locale, t: TEXT[locale], f };
}
