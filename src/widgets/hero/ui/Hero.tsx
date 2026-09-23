import { Button, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { Photo, TYPE } from "@/shared/ui";

/**
 * The promise and the one action. The Figma frame's three terms under the
 * buttons (fixed price, supplies, offices) are owner-unconfirmed and left out
 * (OWNER_TODO "copy:"); the band reads the same without them.
 */
export function Hero({ copy, quoteHref, workHref }: { copy: Copy; quoteHref: string; workHref: string }) {
  const { hero } = copy.t;
  return (
    <Section className="pt-3 pb-[var(--band-py-tight)] md:pt-6">
      <div className="flex flex-col gap-[22px] md:flex-row md:items-center md:gap-16">
        <div className="flex flex-1 flex-col gap-[22px] md:gap-7">
          <h1 className={`${TYPE.h1} max-w-[560px]`}>{hero.title}</h1>
          <p className={`${TYPE.lede} max-w-[540px]`}>{hero.lede}</p>
          <div className="flex items-center gap-6">
            <Button href={quoteHref} size="xl" data-intent="form_open" className="w-full font-semibold md:w-auto">
              {hero.cta}
            </Button>
            <a href={workHref} className="hidden font-medium text-primary-ink hover:underline md:inline">
              {hero.toWork}
            </a>
          </div>
        </div>
        <Photo
          stem="hero"
          alt={hero.photoAlt}
          sizes="(width < 48rem) calc(100vw - 2.5rem), 528px"
          priority
          className="h-[400px] w-full rounded-lg object-cover md:h-[640px] md:w-[528px] md:shrink-0"
        />
      </div>
    </Section>
  );
}
