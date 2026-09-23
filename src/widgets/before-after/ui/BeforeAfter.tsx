import { Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { PAIRS, PHOTO_SETS } from "@/shared/portfolio";
import { TYPE } from "@/shared/ui";
import { Comparison } from "./Comparison";

/**
 * Real jobs, before and after, one pair at a time. The heading and the photo
 * files are resolved here, on the server; only the slider and the picker are
 * a client island, handed the few URLs it shows. Without JavaScript the first
 * pair shows split at 50 %.
 */
export function BeforeAfter({ copy, id }: { copy: Copy; id: string }) {
  const t = copy.t.beforeAfter;
  const pairs = PAIRS.map(key => ({
    caption: t.pairs[key],
    before: PHOTO_SETS[`${key}-before`],
    after: PHOTO_SETS[`${key}-after`],
    thumb: PHOTO_SETS[`${key}-thumb`],
  }));
  return (
    <Section surface="card" id={id}>
      <Comparison
        pairs={pairs}
        words={{ before: t.before, after: t.after, slider: t.slider, picker: t.picker, position: t.position }}
        head={
          <>
            <h2 className={`${TYPE.h2} md:max-w-[500px]`}>{t.title}</h2>
            <p className={`${TYPE.lede} md:max-w-[460px]`}>{t.lede}</p>
          </>
        }
      />
    </Section>
  );
}
