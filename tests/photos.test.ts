import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CUTS, FORMATS, renderModule } from "../scripts/photos";

const root = join(import.meta.dirname, "..");

// `assets/photos/` and `src/shared/portfolio/photos.ts` are generated
// (`npm run photos`, which needs vips) and committed, so the build runs no
// encoder. This keeps the committed pair in step with the plan.
describe("the web photo variants", () => {
  it("module is the generator's output for its CUTS table", () => {
    expect(readFileSync(join(root, "src/shared/portfolio/photos.ts"), "utf8")).toBe(renderModule());
  });

  it("has every variant the module imports", () => {
    const missing = CUTS.flatMap(c => c.widths.flatMap(w => FORMATS.map(f => `assets/photos/${c.stem}-${w}.${f.ext}`))).filter(
      p => !existsSync(join(root, p)),
    );
    expect(missing).toEqual([]);
  });

  it("never upscales a crop", () => {
    for (const c of CUTS) if (c.crop) expect(Math.max(...c.widths), c.stem).toBeLessThanOrEqual(c.crop.width);
  });
});
