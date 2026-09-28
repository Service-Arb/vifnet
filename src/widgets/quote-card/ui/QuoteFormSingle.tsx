"use client";

import { Button, type FormSelectOption, QuoteFormShell } from "@evinvest/kitstart/react";
import { ContactFields, type QuoteWords, SubjectField, TrustLine } from "./fields";
import { WIDE_BUTTON } from "./look";
import { QuoteDone } from "./QuoteDone";
import { useQuoteSubmit } from "./useQuoteSubmit";

export interface QuoteFormSingleProps {
  formId: string;
  placeSlug: string;
  locale: string;
  renderedAt: number;
  words: QuoteWords;
  subjects: readonly FormSelectOption[];
}

/** What the lead store sees as the form; `lead_form_submit` carries it, so kitstart's funnel splits too. */
const FORM_ID = "quote_single_step";

/**
 * Experiment `quote_single_step`, variant b: the control's card as one step —
 * name (the lead schema requires one), phone, postcode and service, and the
 * submit. No bedrooms: the call back asks. The same fields, words and look as
 * the control, and the same form without a script.
 */
export function QuoteFormSingle({ formId, placeSlug, locale, renderedAt, words, subjects }: QuoteFormSingleProps) {
  const { submit, done } = useQuoteSubmit();

  if (done) return <QuoteDone title={words.doneTitle.replace("{first}", done.first)} body={words.doneBody} phone={done.phone} />;

  return (
    <QuoteFormShell id={formId} formId={FORM_ID} placeSlug={placeSlug} locale={locale} renderedAt={renderedAt} honeypotLabel={words.honeypot} className="gap-3">
      <ContactFields words={words} />
      <SubjectField form={formId} label={words.labels.subject} subjects={subjects} />
      <Button ref={submit} type="submit" size="xl" className={WIDE_BUTTON}>
        {words.submit}
      </Button>
      <TrustLine lines={words.trust} />
    </QuoteFormShell>
  );
}
