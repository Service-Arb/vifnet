"use client";

import { FormSelect, type FormSelectProps } from "@evinvest/kitstart/react";
import { usePick } from "../model/picked";

/**
 * No `onValueChange`: a pick remounts the control, so a listener would miss
 * the picked value and the order of the two would be the remount's, not the
 * visitor's.
 */
export interface SubjectSelectProps extends Omit<FormSelectProps, "onValueChange"> {
  /** The `<form>`'s id — what a `SubjectLink` picks into. */
  form: string;
}

/**
 * The form's subject: the kit's `FormSelect` (a native select that posts
 * without JavaScript, the kit's list after hydration), which a service link
 * can set. `FormSelect` owns its value and takes no controlled one, so a pick
 * remounts it on the picked default.
 *
 * The picked service becomes the control's default: a `form.reset()` after a
 * link was clicked goes back to that service, not to the placeholder.
 */
export function SubjectSelect({ form, defaultValue, ...props }: SubjectSelectProps) {
  const pick = usePick(form);
  return <FormSelect key={pick?.n ?? 0} {...props} defaultValue={pick?.subject ?? defaultValue} />;
}
