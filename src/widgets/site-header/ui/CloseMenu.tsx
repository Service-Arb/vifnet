"use client";

import { useEffect, useRef } from "react";

/**
 * Closes the phone menu once a link in it is followed — an in-page anchor does
 * not reload, so the panel would stay over the band it scrolled to — on a
 * press outside the header, and on Esc, handing focus back to the toggle.
 * Renders nothing; without it the menu still opens and closes by its button.
 */
export function CloseMenu({ toggle }: { toggle: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const panel = ref.current?.parentElement;
    const box = document.getElementById(toggle);
    const header = panel?.closest("header");
    if (!panel || !header || !(box instanceof HTMLInputElement)) return;
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a")) box.checked = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !box.checked) return;
      box.checked = false;
      box.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (box.checked && e.target instanceof Node && !header.contains(e.target)) box.checked = false;
    };
    panel.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      panel.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [toggle]);
  return <span ref={ref} hidden />;
}
