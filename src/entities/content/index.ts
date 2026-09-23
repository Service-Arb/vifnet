import type { Locale } from "@/shared/config/i18n";
import { EN } from "./model/en";
import { FR } from "./model/fr";
import type { Text } from "./model/types";

export type { PageCopy, StatusCopy, Text } from "./model/types";

const TEXT = { fr: FR, en: EN } satisfies Record<Locale, Text>;

/** What a section needs to say something: the language and its words. */
export interface Copy {
  locale: Locale;
  t: Text;
}

export function copyFor(locale: Locale): Copy {
  return { locale, t: TEXT[locale] };
}
