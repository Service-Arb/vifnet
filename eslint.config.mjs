import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next's rules, plus the one boundary a landing must hold that steiger does
// not see: a client module never imports the server halves of the package.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Photos are `<picture>`s over files `scripts/photos.ts` already cut to
      // AVIF/WebP at their layout widths; `next/image` would bring back the
      // optimiser `withLanding` turns off.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // The client boundaries; add a client module here when you write one.
    files: [
      "src/views/not-found/ui/NotFound.tsx",
      "src/views/server-error/**",
      "src/widgets/before-after/ui/Comparison.tsx",
      "src/features/pick-subject/ui/SubjectLink.tsx",
      "src/features/pick-subject/ui/SubjectSelect.tsx",
      "src/widgets/site-header/ui/CloseMenu.tsx",
      "app/**/error.tsx",
      "app/**/not-found.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@evinvest/kitstart/server", "@evinvest/kitstart/next", "@evinvest/kitstart/next/*", "@/shared/config/env", "@/shared/config/site"],
              message: "a client module reads BRAND_PUBLIC and the core, never the server halves or the whole site config",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "docs/**"]),
]);
