import { Field, FieldLabel, FormSelect, type FormSelectOption } from "@evinvest/kitstart/react";
import { EXTRAS } from "@/shared/config/lead";
import { FIELD, FINE_PRINT } from "./look";

/**
 * The size of the home, after the phone and optional: nothing chosen posts
 * nothing, and the call back asks what the form did not. Labelled like the
 * kit's fields under `labels="hidden"`: for assistive technology only.
 */
export function BedroomsField({ label, placeholder, options }: { label: string; placeholder: string; options: readonly FormSelectOption[] }) {
  return (
    <Field className="flex flex-col gap-1.5">
      <FieldLabel className="sr-only">{label}</FieldLabel>
      <FormSelect name={EXTRAS.bedrooms.name} size="lg" placeholder={placeholder} options={options} classNames={{ trigger: FIELD }} />
    </Field>
  );
}

export function TrustLine({ lines }: { lines: readonly string[] }) {
  return (
    <ul className={`grid grid-cols-3 gap-4 ${FINE_PRINT} sm:flex sm:justify-center sm:whitespace-nowrap`}>
      {lines.map(line => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
