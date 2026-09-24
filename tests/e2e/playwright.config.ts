import { dirname } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { BREAKPOINTS } from "@evinvest/kitstart/testing/e2e";
import { LEADS_DB, PORT } from "./env";

// Run through the flake (`nix run .#test`), which supplies `@playwright/test`
// and the nixpkgs-pinned browsers — the pin is what makes a screenshot render
// alike on every machine of one OS. Baselines are Linux's, where CI runs, and
// come from CI's `visual-snapshots` artifact only (README); elsewhere the
// pixel comparison is skipped rather than failed against another OS's font
// rasteriser.
const linux = process.platform === "linux";

export default defineConfig({
  testDir: ".",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  ignoreSnapshots: !linux,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  outputDir: "../../test-results",
  reporter: process.env["CI"] ? [["github"], ["list"]] : [["list"]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", stylePath: "./screenshot-section.css" } },
  use: { baseURL: `http://localhost:${PORT}`, deviceScaleFactor: 1, colorScheme: "light", locale: "fr-FR" },
  // The two breakpoints the design draws: 1440 and 390.
  projects: BREAKPOINTS.map(b => ({ name: b.name, use: { ...devices["Desktop Chrome"], viewport: b.viewport } })),
  // The artefact that ships, not `next dev`: `npm run build` first.
  webServer: {
    command: `rm -rf "${dirname(LEADS_DB)}" && mkdir -p "${dirname(LEADS_DB)}" && node .next/standalone/server.js`,
    cwd: "../..",
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    // The standalone server runs as production, which refuses to boot without
    // knowing whose address the rate limit counts.
    env: { PORT: String(PORT), HOSTNAME: "127.0.0.1", LEADS_DB_PATH: LEADS_DB, TRUSTED_PROXY: "xff:1" },
  },
});
