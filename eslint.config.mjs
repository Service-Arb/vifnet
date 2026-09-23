import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Feature-Sliced Design, enforced rather than remembered:
 *
 *   app → views → widgets → features → entities → shared
 *
 * - a layer imports only the layers below it;
 * - a slice is entered through its `index.ts` (or `server.ts`), never a file
 *   inside it;
 * - slices of one layer do not import each other — shared logic moves down,
 *   composition moves up.
 *
 * `steiger` would say the same with more nuance; this is the floor that needs
 * no new dependency.
 */
const LAYERS = ["shared", "entities", "features", "widgets", "views"];
const SLICED = LAYERS.slice(1);

const upward = layer => LAYERS.slice(LAYERS.indexOf(layer) + 1).flatMap(above => [`@/${above}`, `@/${above}/**`]);

const slicesOf = layer => {
  try {
    return readdirSync(new URL(`./src/${layer}`, import.meta.url), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }
};

// Inside a slice, files reach each other relatively; an `@/` path is always a
// way in from outside, so it must stop at the slice's public entry.
const DEEP = {
  group: [...SLICED.map(layer => `@/${layer}/*/**`), ...SLICED.map(layer => `!@/${layer}/*/server`)],
  message: "Import a slice through its index.ts (or server.ts), not a file inside it.",
};

// A relative path that climbs out into a layer directory would slip past every
// `@/` pattern above; across layers the alias is the only way, so the rules
// that read it apply.
const CLIMB = {
  regex: `^(\\.\\./)+(src/)?(${LAYERS.join("|")})(/|$)`,
  message: "Across layers, import through `@/<layer>/<slice>`, not a relative path.",
};

const escape = name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const layerPatterns = (layer, slice) => {
  const siblings = slice === null ? [] : slicesOf(layer).filter(other => other !== slice);
  return [
    ...(layer === "views" ? [] : [{ group: upward(layer), message: `${layer} may import only the layers below it.` }]),
    DEEP,
    CLIMB,
    ...(siblings.length === 0
      ? []
      : [
          {
            group: siblings.flatMap(other => [`@/${layer}/${other}`, `@/${layer}/${other}/**`]),
            message: `Slices of ${layer} do not import each other; move the shared part down a layer.`,
          },
          {
            // `../place` from a slice's index, `../../place` from a segment.
            regex: `^(\\.\\./)+(${siblings.map(escape).join("|")})(/|$)`,
            message: `Slices of ${layer} do not import each other; move the shared part down a layer.`,
          },
        ]),
  ];
};

const layerRules = LAYERS.map(layer => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: { "no-restricted-imports": ["error", { patterns: layerPatterns(layer, null) }] },
}));

// One block per slice, so a slice may not import its siblings. Later blocks
// replace the rule wholesale, so the layer-wide bans are restated.
const sliceRules = SLICED.flatMap(layer =>
  slicesOf(layer).map(slice => ({
    files: [`src/${layer}/${slice}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": ["error", { patterns: layerPatterns(layer, slice) }] },
  })),
);

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Photos will be imported statically and served as they are
      // (`images.unoptimized`); `next/image` would add the optimiser back.
      "@next/next/no-img-element": "off",
    },
  },
  // Routes and the root files sit above every layer but still enter slices
  // through their public API.
  {
    files: ["app/**/*.{ts,tsx}", "proxy.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [DEEP, CLIMB] }] },
  },
  ...layerRules,
  ...sliceRules,
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "docs/**"]),
]);
