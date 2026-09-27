"use client";

import { useEffect, useRef } from "react";

/**
 * Closes the `<details>` it is rendered in on Escape (handing focus back to
 * its summary when focus was inside: focus in a closed disclosure is on
 * nothing visible), on a press or a focus outside it — Tab past the last link
 * would otherwise leave focus in the page under the scrim — or on an element
 * of it marked `data-dismiss` (a scrim), on following one of its links — a `#`
 * on the same page does not reload, so the menu would stay open over the band
 * it scrolled to — and, given `closeFrom`, once the viewport matches that
 * media query (the width where the row shows the nav and the disclosure is
 * hidden, but would still hold the page's scroll lock). Before hydration, or
 * without script, the `<details>` is the platform's own and still opens and
 * closes on its summary. A leaf of its own so the menu around it stays
 * server-rendered.
 */
export function DetailsDismiss({ closeFrom }: { closeFrom?: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const details = anchor.current?.closest("details");
    if (!details) return;
    const close = () => {
      details.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !details.open || e.defaultPrevented) return;
      const hadFocus = details.contains(document.activeElement);
      close();
      if (hadFocus) details.querySelector("summary")?.focus();
    };
    const outside = (e: Event) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) close();
    };
    // A click, not a press, on the scrim: closing on pointerdown would hide it
    // under the finger and hand the click to the page beneath.
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a[href], [data-dismiss]")) close();
    };
    const wide = closeFrom === undefined ? null : window.matchMedia(closeFrom);
    const onWide = () => {
      if (wide?.matches) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    details.addEventListener("click", onClick);
    wide?.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      details.removeEventListener("click", onClick);
      wide?.removeEventListener("change", onWide);
    };
  }, [closeFrom]);
  return <span ref={anchor} hidden />;
}
