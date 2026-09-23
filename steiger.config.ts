import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

// The FSD layers of the brand's `src/`. A slice exports through `index.ts`,
// and its server half through `server.ts`.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // A skeleton has one page of each kind; a real brand's slices earn their
    // keep. Turn this back on once there are a few.
    rules: { "fsd/insignificant-slice": "off" },
  },
  {
    // `shared/config` is read file by file on purpose: `public.ts` must reach a
    // client boundary without `site.ts` (every place) riding along, which a
    // barrel would not guarantee.
    files: ["./src/shared/config/**"],
    rules: { "fsd/public-api": "off" },
  },
  {
    // The same reason for the sidestep rule: `shared/config/<file>`, and the
    // client islands reaching `shared/ui/<file>` past a barrel that would carry
    // every photo URL. Slices above `shared` still export through `index.ts`.
    files: ["./src/shared/**"],
    rules: { "fsd/no-public-api-sidestep": "off" },
  },
]);
