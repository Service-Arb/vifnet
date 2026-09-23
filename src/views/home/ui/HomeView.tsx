import { JsonLd } from "@evinvest/marketing";
import { Footer } from "@evinvest/uikit";
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
      {/* No `offices`: a service-area business has no address to list. */}
      <Footer brand={SITE.brand.name} description={copy.t.footer.legal} copyright={`© ${SITE.brand.name}`} />
    </>
  );
}
