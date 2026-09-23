import { Badge, Prose, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { perLocale } from "@/shared/config/i18n";
import { LangSwitch } from "@/shared/ui/LangSwitch";

const HOME_HREFS = perLocale(l => `/${l}`);

/**
 * The placeholder page's head: the brand, the trade, and that the site is not
 * finished. Replaced by the designed hero; it exists so the build and the
 * browser tests exercise a real page on the kit.
 */
export function HoldingHero({ copy, brand }: { copy: Copy; brand: string }) {
  const { t } = copy;
  return (
    <Section polarity="dark" surface="background">
      <div className="flex items-center justify-between gap-6">
        <span className="font-display text-xl font-bold tracking-wide">{brand}</span>
        <LangSwitch current={copy.locale} hrefs={HOME_HREFS} label={t.langSwitchLabel} />
      </div>
      <div className="mt-16 flex max-w-3xl flex-col items-start gap-6 md:mt-24">
        <Badge variant="secondary">{t.home.eyebrow}</Badge>
        <h1 className="font-display text-4xl leading-tight font-semibold text-ink md:text-6xl">{t.home.h1}</h1>
        <Prose className="text-ink-mid">{t.home.lede}</Prose>
      </div>
    </Section>
  );
}
