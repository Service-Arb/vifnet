"use client";

import { LOCKUP_PARTS, lockupId, type LockupPart } from "./lockup";
import { HOUSE, STAR, SWOOSH, TAGLINE, WINDOW, WORD } from "./paths";

const PATHS: Record<LockupPart, string> = { house: HOUSE, window: WINDOW, swoosh: SWOOSH, star: STAR, word: WORD, tagline: TAGLINE };

/**
 * The lock-up's paths once per document, for every `Logo` to `<use>`; mounted
 * by each root layout. In the HTML, not an external SVG: a `<use>` of a file
 * is fetched at low priority (a preload is not reused), so the logo painted
 * seconds after the header on a slow line. A client component so the paths
 * ride in a cached chunk instead of every page's RSC payload — on the server
 * they would be in the HTML twice, too far apart for gzip to fold.
 * Unpainted, so no `fill`: each `<use>` sets its own.
 */
export function LockupSprite() {
  return (
    <svg aria-hidden="true" width="0" height="0" focusable="false" style={{ position: "absolute", overflow: "hidden" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {LOCKUP_PARTS.map(part => (
          <path key={part} id={lockupId(part)} d={PATHS[part]} />
        ))}
      </defs>
    </svg>
  );
}
