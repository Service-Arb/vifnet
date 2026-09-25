import {
  Button,
  Field,
  FieldLabel,
  Input,
  PHONE_INPUT_PROPS,
  QuoteFormShell,
} from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SubjectSelect } from "@/features/pick-subject";
import { LEAD, SURFACE_M2 } from "@/shared/config/lead";
import { TYPE } from "@/shared/ui";

export interface QuoteFormProps {
  copy: Copy;
  placeSlug: string;
  renderedAt: number;
  /** The `<form>`'s id — what the service links pick a subject in. */
  formId: string;
}

/**
 * The four fields, on the kit's headless shell: a plain POST to `/quote`
 * answered with a 303, so it works before any JavaScript arrives. Field names
 * are `site.lead.wire` and the surface extra; controls are the kit's at
 * size `lg` (48 px, 16 px text — no zoom on iOS). The subject is the kit's
 * `FormSelect`: a native select until hydration, the kit's list after — never
 * the platform's menu once a script runs.
 */
export function QuoteForm({ copy, placeSlug, renderedAt, formId }: QuoteFormProps) {
  const { t, locale } = copy;
  const l = t.quoteLabels;
  return (
    <QuoteFormShell
      id={formId}
      placeSlug={placeSlug}
      locale={locale}
      renderedAt={renderedAt}
      honeypotLabel={t.quoteForm.honeypotLabel}
      className="gap-[18px] rounded-lg border border-border bg-card p-5 md:p-8"
    >
      <Field className="flex flex-col gap-2">
        <FieldLabel>{l.subject}</FieldLabel>
        <SubjectSelect
          form={formId}
          name={LEAD.wire.subject}
          size="lg"
          placeholder={l.choose}
          required
          options={LEAD.subjects.map(s => ({ value: s, label: t.subjects[s] }))}
        />
      </Field>
      <div className="flex gap-3">
        <Field className="flex w-[140px] shrink-0 flex-col gap-2">
          <FieldLabel>{l.surface}</FieldLabel>
          <Input name={SURFACE_M2.name} size="lg" inputMode="numeric" pattern="[0-9]*" placeholder={l.surfaceHint} />
        </Field>
        <Field className="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel>{l.locality}</FieldLabel>
          <Input name={LEAD.wire.locality} size="lg" autoComplete="address-level2" placeholder={l.localityHint} required />
        </Field>
      </div>
      <Field className="flex flex-col gap-2">
        <FieldLabel>{l.mobile}</FieldLabel>
        <Input name={LEAD.wire.mobile} size="lg" {...PHONE_INPUT_PROPS} placeholder={l.mobileHint} required />
        <p className={`${TYPE.fine} leading-[1.4] text-ink-soft`}>{l.callback}</p>
      </Field>
      <Button type="submit" size="xl" className="w-full font-semibold">
        {t.quoteForm.submit}
      </Button>
      <p className={`${TYPE.fine} leading-[1.45] text-ink-soft`}>{t.quoteForm.privacy}</p>
    </QuoteFormShell>
  );
}
