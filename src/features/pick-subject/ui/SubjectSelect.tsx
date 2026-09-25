"use client";

import { FormSelect, type FormSelectProps } from "@evinvest/kitstart/react";
import { usePick } from "../model/picked";

export interface SubjectSelectProps extends FormSelectProps {
  /** The `<form>`'s id — what a `SubjectLink` picks into. */
  form: string;
}

/**
 * The form's subject: the kit's `FormSelect` (a native select that posts
 * without JavaScript, the kit's list after hydration), which a service link
 * can set. `FormSelect` owns its value and takes no controlled one, so a pick
 * remounts it on the picked default.
 */
export function SubjectSelect({ form, defaultValue, ...props }: SubjectSelectProps) {
  const pick = usePick(form);
  return <FormSelect key={pick?.n ?? 0} {...props} defaultValue={pick?.subject ?? defaultValue} />;
}
