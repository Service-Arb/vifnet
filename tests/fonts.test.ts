import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

/**
 * The range the served `.woff2` faces are cut to (`assets/fonts/README.md`):
 * Basic Latin, Latin-1, œ/Œ, typographic punctuation, €, ™, the arrows, ★, ✓,
 * ☎ and ☰ — aquafix's `scripts/subset-fonts.sh` `LATIN` list — plus ↗.
 */
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2197,U+2212,U+2215,U+2605,U+260E,U+2630,U+2713,U+FEFF,U+FFFD";

const ranges: [number, number][] = LATIN.split(",").map(item => {
  const [lo = "", hi = lo] = item.replace(/^U\+/, "").split("-");
  return [parseInt(lo, 16), parseInt(hi, 16)];
});

function sources(dir: string): string[] {
  return readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
    .filter(f => /\.tsx?$/.test(f))
    .map(f => join(dir, f));
}

// A character outside the subset still renders — in a fallback face, a
// mismatched glyph in the middle of a headline. Everything a visitor reads is
// written in these trees.
const RENDERED = ["src/entities/content", "src/widgets", "src/views", "src/shared/ui"];

describe("the web font subset", () => {
  it("covers every character the page copy uses", () => {
    const covered = (cp: number) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
    const missing = new Map<string, string>();
    for (const file of RENDERED.flatMap(sources)) {
      for (const ch of readFileSync(join(root, file), "utf8")) {
        const cp = ch.codePointAt(0) ?? 0;
        if (!covered(cp) && !missing.has(ch)) missing.set(ch, `U+${cp.toString(16).toUpperCase()} in ${file}`);
      }
    }
    expect([...missing.values()]).toEqual([]);
  });
});
