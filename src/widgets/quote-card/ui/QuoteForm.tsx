"use client";

import { Button, Field, FieldLabel, FormSelect, type FormSelectOption, Input, PHONE_INPUT_PROPS, QuoteFormShell } from "@evinvest/kitstart/react";
import { useEffect, useRef, useState } from "react";
import { SubjectSelect } from "@/features/pick-subject";
import { DEFAULTS, EXTRAS, LEAD } from "@/shared/config/lead";
import { FIELD, WIDE_BUTTON } from "./look";
import { QuoteDone } from "./QuoteDone";

/** Plain strings only: they cross into the client bundle. */
export interface QuoteWords {
  placeholders: { name: string; mobile: string; locality: string };
  labels: { name: string; mobile: string; locality: string; bedrooms: string; subject: string };
  next: string;
  almost: string;
  submit: string;
  honeypot: string;
  trust: readonly string[];
  doneTitle: string;
  doneBody: readonly [string, string];
}

export interface QuoteFormProps {
  formId: string;
  placeSlug: string;
  locale: string;
  renderedAt: number;
  words: QuoteWords;
  bedrooms: readonly FormSelectOption[];
  subjects: readonly FormSelectOption[];
}

const INPUT = `${FIELD} px-4`;

/**
 * The frame's two steps and its Done state in one card. Step 1 asks name,
 * phone and ZIP; "Continue" checks them and shows step 2, bedrooms and service;
 * the submit posts `/quote` as a plain form would, and a 303 to the thanks page
 * turns the card to Done. Any other answer, or no network, submits the form
 * for real, so the server's own page says what went wrong.
 *
 * Without a script (`noscript:`) both steps are one form, posting to `/quote`
 * and answered with a 303, as before any of this existed.
 */
export function QuoteForm({ formId, placeSlug, locale, renderedAt, words, bedrooms, subjects }: QuoteFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [done, setDone] = useState<{ first: string; phone: string } | null>(null);
  const first = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLParagraphElement>(null);
  const submit = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const form = submit.current?.form;
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get(EXTRAS.name.name) ?? "").trim();
      const phone = String(data.get(LEAD.wire.mobile) ?? "").trim();
      fetch(form.action, { method: "POST", body: data })
        .then(res => (res.ok && new URL(res.url).pathname.endsWith("/thanks") ? setDone({ first: name.split(/\s+/)[0] ?? name, phone }) : form.submit()))
        .catch(() => form.submit());
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  // Step 1 leaves with the button that had focus: hand focus to step 2's heading.
  useEffect(() => {
    if (step === 2) second.current?.focus();
  }, [step]);

  if (done) return <QuoteDone title={words.doneTitle.replace("{first}", done.first)} body={words.doneBody} phone={done.phone} />;

  const next = () => {
    for (const input of first.current?.querySelectorAll("input") ?? []) if (!input.reportValidity()) return;
    setStep(2);
  };

  return (
    <QuoteFormShell id={formId} placeSlug={placeSlug} locale={locale} renderedAt={renderedAt} honeypotLabel={words.honeypot} className="gap-3">
      <div ref={first} className={step === 1 ? "flex flex-col gap-3" : "hidden"}>
        <Field>
          <FieldLabel className="sr-only">{words.labels.name}</FieldLabel>
          <Input name={EXTRAS.name.name} autoComplete="name" maxLength={EXTRAS.name.max} placeholder={words.placeholders.name} required className={INPUT} />
        </Field>
        <Field>
          <FieldLabel className="sr-only">{words.labels.mobile}</FieldLabel>
          <Input name={LEAD.wire.mobile} {...PHONE_INPUT_PROPS} placeholder={words.placeholders.mobile} required className={INPUT} />
        </Field>
        <Field>
          <FieldLabel className="sr-only">{words.labels.locality}</FieldLabel>
          <Input name={LEAD.wire.locality} autoComplete="postal-code" placeholder={words.placeholders.locality} required className={INPUT} />
        </Field>
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
        <Field>
          <FieldLabel className="sr-only">{words.labels.subject}</FieldLabel>
          <SubjectSelect form={formId} name={LEAD.wire.subject} size="lg" options={subjects} defaultValue={DEFAULTS.subject} classNames={{ trigger: FIELD }} />
        </Field>
        <Button ref={submit} type="submit" size="xl" className={WIDE_BUTTON}>
          {words.submit}
        </Button>
      </div>
      <ul className="grid grid-cols-3 gap-4 text-center text-[11px] leading-[16.5px] text-slate-400 sm:flex sm:justify-center sm:whitespace-nowrap">
        {words.trust.map(line => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </QuoteFormShell>
  );
}
