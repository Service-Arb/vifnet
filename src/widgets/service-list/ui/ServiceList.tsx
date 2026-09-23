import { Card, CardDescription, CardHeader, CardTitle, Section, SectionHead } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { CLEANING_TYPES } from "@/shared/config/site";

/** The kinds of job, in the order the quote form will offer them. */
export function ServiceList({ copy }: { copy: Copy }) {
  const { t } = copy;
  return (
    <Section surface="card" aria-labelledby="services-title">
      <SectionHead eyebrow={t.home.servicesEyebrow} title={<span id="services-title">{t.home.servicesTitle}</span>} />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLEANING_TYPES.map(id => (
          <li key={id}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t.services[id].name}</CardTitle>
                <CardDescription>{t.services[id].body}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
