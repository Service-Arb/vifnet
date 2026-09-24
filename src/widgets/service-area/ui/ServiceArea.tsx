import { servedLocalities, type Place } from "@evinvest/kitstart";
import { Coverage, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { TYPE } from "@/shared/ui";

/**
 * Where the crew goes, as commune chips — a service-area business lists
 * communes, never a street address or a map. Absent until the owner names the
 * communes: the Figma chips are guesses (OWNER_TODO serviceArea), and a band
 * saying "the towns listed here" over no towns would be worse than none.
 */
export function ServiceArea({ copy, id, place }: { copy: Copy; id: string; place: Place<Locale> }) {
  if (servedLocalities(place).length === 0) return null;
  const t = copy.t.serviceArea;
  return (
    <Section surface="card" id={id}>
      <div className="flex flex-col gap-8 md:flex-row md:gap-20">
        <div className="flex flex-col gap-3 md:w-[400px] md:shrink-0 md:gap-4">
          <h2 className={TYPE.h2}>{t.title}</h2>
          <p className={TYPE.lede}>{t.lede}</p>
        </div>
        <Coverage place={place} locale={copy.locale} className="flex-1" />
      </div>
    </Section>
  );
}
