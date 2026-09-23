import { JsonLd } from "@evinvest/marketing";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { PLACE } from "@/entities/place";
import { pageGraph } from "@/features/seo";
import { SITE } from "@/shared/config/site";
import { HoldingHero } from "@/widgets/holding-hero";
import { ServiceList } from "@/widgets/service-list";

export function HomeView({ copy }: { copy: Copy }) {
  return (
    <>
      <JsonLd data={pageGraph(SITE, PLACE, copy)} />
      <main>
        <HoldingHero copy={copy} brand={SITE.brand.name} />
        <ServiceList copy={copy} />
      </main>
      <Section tight>
        <footer className="flex flex-col gap-1 text-sm text-ink-soft">
          <span>© {SITE.brand.name}</span>
          <span>{copy.t.footer.legal}</span>
        </footer>
      </Section>
    </>
  );
}
