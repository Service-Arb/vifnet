"use client";

import type { ReactNode } from "react";

export interface SubjectLinkProps {
  /** The form's anchor: `#devis`. */
  href: string;
  /** The `<form>`'s id and its subject control's name (`site.lead.wire.subject`). */
  form: string;
  field: string;
  subject: string;
  className?: string;
  children: ReactNode;
}

/**
 * "Ask for this quote": a plain link to the form that, once JavaScript is
 * there, also picks the service in the form's subject control. Without it the
 * link still lands on the form, which is the part that matters.
 */
export function SubjectLink({ href, form, field, subject, className, children }: SubjectLinkProps) {
  return (
    <a
      href={href}
      data-intent="form_open"
      className={className}
      onClick={() => {
        const control = document.getElementById(form)?.querySelector<HTMLSelectElement>(`select[name="${field}"]`);
        if (control) control.value = subject;
      }}
    >
      {children}
    </a>
  );
}
