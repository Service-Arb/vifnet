import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // The image ships `.next/standalone`: the server plus only the files it was
  // traced to need, not the dev toolchain `npm ci` installed to build it.
  output: "standalone",
  // Photos will be imported statically and served as fingerprinted files; the
  // optimiser would add a native dependency to the Nix image for sources that
  // are already sized for the page.
  images: { unoptimized: true },
  // With `unoptimized` sharp is never loaded, and its prebuilt libvips links
  // against a system loader the Nix image does not have.
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
  // `next dev` would otherwise write its own AGENTS.md and CLAUDE.md into the
  // repo root; this repo's agent instructions are authored, not generated.
  agentRules: false,
  experimental: {
    // The root layout is under `[locale]`, so an unmatched URL has no layout
    // to render a segment `not-found.tsx` in; see `app/global-not-found.tsx`.
    globalNotFound: true,
  },
};

export default config;
