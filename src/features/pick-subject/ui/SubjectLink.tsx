"use client";

import type { ReactNode } from "react";
import { pickSubject } from "../model/picked";

export interface SubjectLinkProps {
  /** The form's anchor: `#devis`. */
  href: string;
  /** The `<form>`'s id, whose `SubjectSelect` takes the pick. */
  form: string;
  subject: string;
  className?: string;
  children: ReactNode;
}

/**
 * "Ask for this quote": a plain link to the form that, once JavaScript is
 * there, also picks the service in the form's subject control. Without it the
 * link still lands on the form, which is the part that matters.
 */
export function SubjectLink({ href, form, subject, className, children }: SubjectLinkProps) {
  return (
    <a href={href} data-intent="form_open" className={className} onClick={() => pickSubject(form, subject)}>
      {children}
    </a>
  );
}
