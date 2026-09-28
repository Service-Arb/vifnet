"use client";

import { Button, Field, FieldLabel, FormSelect, type FormSelectOption, QuoteFormShell } from "@evinvest/kitstart/react";
import { useEffect, useRef, useState } from "react";
import { useExperimentStep } from "@/features/experiment";
import { DEFAULTS, EXTRAS } from "@/shared/config/lead";
import { ContactFields, type QuoteWords, SubjectField, TrustLine } from "./fields";
import { FIELD, WIDE_BUTTON } from "./look";
import { QuoteDone } from "./QuoteDone";
import { useQuoteSubmit } from "./useQuoteSubmit";

export type { QuoteWords } from "./fields";

export interface QuoteFormProps {
  formId: string;
  placeSlug: string;
  locale: string;
  renderedAt: number;
  words: QuoteWords;
  bedrooms: readonly FormSelectOption[];
  subjects: readonly FormSelectOption[];
}

/**
 * The frame's two steps and its Done state in one card — experiment
 * `quote_single_step`'s control. Step 1 asks name, phone and ZIP; "Continue"
 * checks them and shows step 2, bedrooms and service; the submit is
 * `useQuoteSubmit`'s.
 *
 * Without a script (`noscript:`) both steps are one form, posting to `/quote`
 * and answered with a 303, as before any of this existed.
 */
export function QuoteForm({ formId, placeSlug, locale, renderedAt, words, bedrooms, subjects }: QuoteFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const { submit, done } = useQuoteSubmit();
  const reached = useExperimentStep();
  const first = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLParagraphElement>(null);

  // Step 1 leaves with the button that had focus: hand focus to step 2's heading.
  useEffect(() => {
    if (step === 2) second.current?.focus();
  }, [step]);

  if (done) return <QuoteDone title={words.doneTitle.replace("{first}", done.first)} body={words.doneBody} phone={done.phone} />;

  const next = () => {
    for (const input of first.current?.querySelectorAll("input") ?? []) if (!input.reportValidity()) return;
    setStep(2);
    reached(2);
  };

  return (
    <QuoteFormShell id={formId} placeSlug={placeSlug} locale={locale} renderedAt={renderedAt} honeypotLabel={words.honeypot} className="gap-3">
      <div ref={first} className={step === 1 ? "flex flex-col gap-3" : "hidden"}>
        <ContactFields words={words} />
        <Button type="button" size="xl" onClick={next} className={`${WIDE_BUTTON} noscript:hidden`}>
          {words.next}
        </Button>
      </div>
      <div className={step === 2 ? "flex flex-col gap-3" : "hidden noscript:flex noscript:flex-col noscript:gap-3"}>
        <p ref={second} tabIndex={-1} className="text-sm leading-5 font-semibold text-brand outline-none">
          {words.almost}
        </p>
        <Field>
          <FieldLabel className="sr-only">{words.labels.bedrooms}</FieldLabel>
          <FormSelect name={EXTRAS.bedrooms.name} size="lg" options={bedrooms} defaultValue={DEFAULTS.bedrooms} classNames={{ trigger: FIELD }} />
        </Field>
        <SubjectField form={formId} label={words.labels.subject} subjects={subjects} />
        <Button ref={submit} type="submit" size="xl" className={WIDE_BUTTON}>
          {words.submit}
        </Button>
      </div>
      <TrustLine lines={words.trust} />
    </QuoteFormShell>
  );
}
