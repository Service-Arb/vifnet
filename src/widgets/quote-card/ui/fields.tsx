import { Field, FieldLabel, type FormSelectOption, Input, PHONE_INPUT_PROPS } from "@evinvest/kitstart/react";
import { SubjectSelect } from "@/features/pick-subject";
import { DEFAULTS, EXTRAS, LEAD } from "@/shared/config/lead";
import { FIELD } from "./look";

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

const INPUT = `${FIELD} px-4`;

/** Name, phone and postcode: the frame's step 1, and the first half of the one-step card. */
export function ContactFields({ words }: { words: QuoteWords }) {
  return (
    <>
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
    </>
  );
}

/** The service: a service card's link picks it (`form` is the `<form>`'s id). */
export function SubjectField({ form, label, subjects }: { form: string; label: string; subjects: readonly FormSelectOption[] }) {
  return (
    <Field>
      <FieldLabel className="sr-only">{label}</FieldLabel>
      <SubjectSelect form={form} name={LEAD.wire.subject} size="lg" options={subjects} defaultValue={DEFAULTS.subject} classNames={{ trigger: FIELD }} />
    </Field>
  );
}

export function TrustLine({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="grid grid-cols-3 gap-4 text-center text-[11px] leading-[16.5px] text-slate-400 sm:flex sm:justify-center sm:whitespace-nowrap">
      {lines.map(line => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
