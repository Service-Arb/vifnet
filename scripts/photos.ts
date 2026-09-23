// Cuts the web variants of `assets/profile_images/*.png` — AVIF and WebP at
// the widths the page lays them out at — into `assets/photos/`, and writes
// `src/shared/portfolio/photos.ts`, the module that imports them (so Next
// fingerprints each file) and spells their `srcset`s.
//
// Both outputs are committed: the Nix build runs no image encoder. Rerun after
// touching a photo or a line below; `tests/photos.test.ts` fails when the
// module no longer matches this plan.
//
//   nix shell nixpkgs#vips -c npm run photos
//
// Plain `node` runs it (type stripping), so it imports nothing but builtins.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Crop {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Cut {
  /** Output name stem; the file is `<stem>-<width>.<format>`. */
  stem: string;
  source: string;
  widths: number[];
  /** A region of the source, in source pixels, taken before resizing. */
  crop?: Crop;
  /** Centre-cropped to a square: a thumbnail the layout shows square. */
  square?: boolean;
}

/**
 * A before/after composite, split into its halves. The halves are not at 50 %
 * and carry burned-in AVANT / APRÈS labels (top of the before, bottom of the
 * after): each rectangle is the half's 4:5 region without its label, the same
 * size for both so the slider compares like with like. Read off the sources.
 */
function pair(stem: string, source: string, before: Crop, after: Crop): Cut[] {
  // A phone's file and the crop's full width; one file when the crop is no wider.
  const widths = before.width > 480 ? [480, before.width] : [before.width];
  return [
    { stem: `${stem}-before`, source, widths, crop: before },
    { stem: `${stem}-after`, source, widths, crop: after },
    // The picker shows the composite itself, both halves, as a square.
    { stem: `${stem}-thumb`, source, widths: [144], square: true },
  ];
}

/** The plan. Widths never exceed the (cropped) source: an upscale is bytes with no detail in them. */
export const CUTS: Cut[] = [
  // 528×640 on desktop, full width × 400 on a phone.
  { stem: "hero", source: "team_portrait_in_vifnet_uniforms.png", widths: [560, 1056] },
  // 520×340 on desktop; not shown on a phone.
  { stem: "closing", source: "staff_in_modern_kitchen_cleaning_cabinets.png", widths: [560, 1040] },
  // Service rows: 168 px squares on desktop, 96 on a phone.
  { stem: "svc-deep", source: "final_clean_oven_interior.png", widths: [192, 336], square: true },
  { stem: "svc-after-works", source: "protected_renovation_corridor_with_plastic_sheeting.png", widths: [192, 336], square: true },
  { stem: "svc-upholstery", source: "in_progress_gray_sofa_upholstery_cleaning.png", widths: [192, 336], square: true },
  { stem: "svc-exterior", source: "before_after_pressure_washing_gravel_patio.png", widths: [192, 336], square: true },
  { stem: "svc-other", source: "staff_in_gilded_salon_mirror_cleaning.png", widths: [192, 336], square: true },
  // The before/after viewer: 560×700 on desktop, 350×438 on a phone.
  ...pair(
    "sofa",
    "before_after_beige_sectional_sofa.png",
    { left: 0, top: 181, width: 717, height: 896 },
    { left: 731, top: 181, width: 717, height: 896 },
  ),
  ...pair(
    "bathtub",
    "before_after_stained_bathtub.png",
    { left: 0, top: 386, width: 519, height: 649 },
    { left: 603, top: 386, width: 519, height: 649 },
  ),
  // Stacked, not side by side: the before is the top half.
  ...pair(
    "carpet",
    "before_after_stained_carpet_01.png",
    { left: 627, top: 0, width: 491, height: 614 },
    { left: 188, top: 640, width: 491, height: 614 },
  ),
  ...pair(
    "driveway",
    "before_after_herringbone_paver_driveway.png",
    { left: 0, top: 219, width: 539, height: 674 },
    { left: 558, top: 251, width: 539, height: 674 },
  ),
  ...pair(
    "mattress",
    "before_after_mattress_stain.png",
    { left: 0, top: 219, width: 549, height: 686 },
    { left: 571, top: 251, width: 549, height: 686 },
  ),
  ...pair(
    "recliner",
    "before_after_recliner_armchair_upholstery.png",
    { left: 0, top: 219, width: 461, height: 576 },
    { left: 480, top: 314, width: 461, height: 576 },
  ),
];

export const FORMATS = [
  // Quality picked by eye against the png at 100 %; AVIF's scale runs lower.
  { ext: "avif", options: "[Q=52,effort=6,strip]" },
  { ext: "webp", options: "[Q=74,effort=6,strip]" },
] as const;

const SOURCES = "assets/profile_images";
const WEB = "assets/photos";
const MODULE = "src/shared/portfolio/photos.ts";

const ident = (s: string) => s.replace(/[^a-z0-9]+/gi, "_");

/** The module text for {@link CUTS} — also what the test compares against. */
export function renderModule(): string {
  const imports: string[] = [];
  const sets: string[] = [];
  for (const cut of CUTS) {
    const byFormat = FORMATS.map(f => {
      const parts = cut.widths.map(w => {
        const name = ident(`${cut.stem}_${w}_${f.ext}`);
        imports.push(`import ${name} from "../../../${WEB}/${cut.stem}-${w}.${f.ext}";`);
        return `\`\${${name}.src} ${w}w\``;
      });
      return `    ${f.ext}: [${parts.join(", ")}].join(", "),`;
    });
    // The `<img>` fallback: the widest WebP, which every browser this site
    // supports decodes.
    const widest = ident(`${cut.stem}_${Math.max(...cut.widths)}_webp`);
    sets.push(`  "${cut.stem}": {\n${byFormat.join("\n")}\n    src: ${widest}.src,\n  },`);
  }
  return [
    "// GENERATED by scripts/photos.ts from its CUTS table — do not edit by hand;",
    "// change the table and run `nix shell nixpkgs#vips -c npm run photos`.",
    ...imports,
    "",
    "/** Each photo's `srcset` per format, for a `<picture>`'s `<source>`s, and its `<img>` fallback. */",
    "export const PHOTO_SETS = {",
    ...sets,
    "} as const;",
    "",
    "export type PhotoStem = keyof typeof PHOTO_SETS;",
    "",
  ].join("\n");
}

function cut(c: Cut, width: number, ext: string, options: string) {
  const out = join(WEB, `${c.stem}-${width}.${ext}`);
  let input = join(SOURCES, c.source);
  const tmp = join(WEB, `.${c.stem}-crop.v`);
  if (c.crop) {
    const { left, top, width: w, height: h } = c.crop;
    execFileSync("vips", ["extract_area", input, tmp, String(left), String(top), String(w), String(h)]);
    input = tmp;
  }
  const square = c.square ? ["--height", String(width), "--crop", "centre"] : [];
  execFileSync("vips", ["thumbnail", input, `${out}${options}`, String(width), "--size", "down", ...square]);
  if (c.crop) rmSync(tmp);
}

function main() {
  rmSync(WEB, { recursive: true, force: true });
  mkdirSync(WEB, { recursive: true });
  for (const c of CUTS) for (const w of c.widths) for (const f of FORMATS) cut(c, w, f.ext, f.options);
  mkdirSync("src/shared/portfolio", { recursive: true });
  writeFileSync(MODULE, renderModule());
  console.log(`✔ ${WEB}/ and ${MODULE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
