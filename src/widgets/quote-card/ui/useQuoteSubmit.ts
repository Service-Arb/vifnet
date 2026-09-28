"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { EXTRAS, LEAD } from "@/shared/config/lead";

export type QuoteDoneState = { first: string; phone: string };

/**
 * The card's submit with a script: the form posts `/quote` as a plain form
 * would, and a 303 to the thanks page turns the card to Done. Any other
 * answer, or no network, submits the form for real, so the server's own page
 * says what went wrong. Hand the returned ref to the submit button.
 */
export function useQuoteSubmit(): { submit: RefObject<HTMLButtonElement | null>; done: QuoteDoneState | null } {
  const [done, setDone] = useState<QuoteDoneState | null>(null);
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

  return { submit, done };
}
