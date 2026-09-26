import { AreaChips, MapFacade, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SAMPLE_MAP_QUERY } from "@/shared/config/sample";
import { TYPE } from "@/shared/ui";

/**
 * The frame's MapFacade (38:1485) through the kit's parts: the face is the
 * kit's one button, the call to action (`show`) drawn as a forest pill and
 * set last, and the label (`address`) carrying the forest pin above it — the
 * pin's house is the icon file masked in gold. Nothing loads from Google
 * until the click.
 */
const MAP = {
  root: "hidden h-[360px] min-w-0 flex-1 rounded-2xl border-input bg-hover md:block md:aspect-auto",
  show: "order-last mt-1 rounded-lg bg-brand px-4 py-2.5 font-sans text-sm leading-5 font-bold text-white",
  address: [
    "vf-icon-home relative flex flex-col items-center gap-3 text-sm leading-5 font-semibold text-brand",
    "before:size-12 before:rounded-full before:bg-brand",
    "after:absolute after:top-[13px] after:left-1/2 after:size-[22px] after:-translate-x-1/2 after:bg-primary after:[mask:var(--vf-icon)_center/100%_100%_no-repeat]",
  ].join(" "),
} as const;

/**
 * The about page's service area on cream: where the crew goes as the kit's
 * chips, and beside them from `md` the map behind a click — the Mobile frame
 * has no map. The towns and the map are the frame's sample (OWNER_TODO): a
 * `service-area` place has no communes yet, and no address to map.
 */
export function ServiceArea({ copy, id }: { copy: Copy; id: string }) {
  const a = copy.t.area;
  return (
    <Section id={id} surface="card" data-band="service-area" className="py-20">
      <div className="flex flex-col items-center gap-6 md:flex-row md:gap-14">
        <div className="flex w-full flex-col gap-3 md:w-[460px] md:shrink-0">
          <p className={`${TYPE.eyebrow} text-positive`}>{a.eyebrow}</p>
          <h2 className={`${TYPE.h2} text-brand`}>{a.title}</h2>
          <p className="text-base leading-[26px] text-ink-soft">{a.lede}</p>
          <AreaChips areas={a.towns} className="gap-2 pt-2 md:gap-2" chipClassName="border-input bg-background px-3.5 leading-5 text-brand" />
        </div>
        <MapFacade
          query={SAMPLE_MAP_QUERY}
          title={a.map.title}
          show={a.map.show}
          address={a.map.label}
          className={MAP.root}
          classNames={{ show: MAP.show, address: MAP.address }}
        />
      </div>
    </Section>
  );
}
