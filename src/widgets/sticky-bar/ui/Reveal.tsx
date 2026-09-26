"use client";

import { type ReactNode, useEffect, useState } from "react";

/** How far down the page the bar slides in, as the frame's note says (8:170). */
const AFTER_PX = 600;

/**
 * Slides its bar up from under the viewport once the visitor has scrolled past
 * the hero, and keeps it there. Without a script the bar stays out of view:
 * the header's "Book Now" and the hero's card are the same actions.
 */
export function Reveal({ className, children }: { className: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown) return;
    const onScroll = () => {
      if (window.scrollY > AFTER_PX) setShown(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [shown]);
  return (
    <div data-band="sticky" data-shown={shown} inert={!shown} className={`${className} ${shown ? "translate-y-0" : "translate-y-full"}`}>
      {children}
    </div>
  );
}
