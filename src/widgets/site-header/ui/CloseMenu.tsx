"use client";

import { useEffect, useRef } from "react";

/**
 * Closes the enclosing `<details>` menu once a link in it is followed — an
 * in-page anchor does not reload, so the panel would stay over the band it
 * scrolled to — on a press outside it, when focus leaves it, and on Esc,
 * handing focus back to the menu button. Renders nothing; without it the menu
 * still opens and closes by its button.
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
    const onPointerDown = (e: PointerEvent) => {
      if (menu.open && e.target instanceof Node && !menu.contains(e.target)) menu.open = false;
    };
    // A `null` target is the window losing focus (another app, devtools): the
    // menu stays as the visitor left it; a press outside is `onPointerDown`'s.
    const onFocusOut = (e: FocusEvent) => {
      if (menu.open && e.relatedTarget instanceof Node && !menu.contains(e.relatedTarget)) menu.open = false;
    };
    menu.addEventListener("click", onClick);
    menu.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      menu.removeEventListener("click", onClick);
      menu.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
  return <span ref={ref} hidden />;
}
