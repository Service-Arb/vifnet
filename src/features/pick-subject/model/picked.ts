import { useSyncExternalStore } from "react";

/**
 * The subject a service link picked, per form. `n` counts the picks, so a
 * second click on the same service still reaches a control the visitor has
 * changed since.
 */
export interface Pick {
  subject: string;
  n: number;
}

const picks = new Map<string, Pick>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function pickSubject(form: string, subject: string) {
  picks.set(form, { subject, n: (picks.get(form)?.n ?? 0) + 1 });
  for (const listener of listeners) listener();
}

/** Nothing on the server: a pick only ever comes from a click. */
export function usePick(form: string): Pick | undefined {
  return useSyncExternalStore(
    subscribe,
    () => picks.get(form),
    () => undefined,
  );
}
