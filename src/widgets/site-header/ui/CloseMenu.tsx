"use client";

import { useEffect, useRef } from "react";

/**
 * Closes the enclosing `<details>` menu once a link in it is followed — an
 * in-page anchor does not reload, so the panel would stay over the band it
 * scrolled to — and on Esc, handing focus back to the menu button. Renders
 * nothing; without it the menu still opens and closes by its button.
 */
export function CloseMenu() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const menu = ref.current?.closest("details");
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a")) menu.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !menu.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    menu.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      menu.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return <span ref={ref} hidden />;
}
