import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * What the server under test is started with, shared by the config (which
 * starts it) and the specs (which read what it wrote). A port of its own, so a
 * `nix run .#dev` on 59082 is never mistaken for the build under test.
 */
export const PORT = Number(process.env["E2E_PORT"] ?? 59089);

/** Emptied when the server starts: an earlier run's rows must not satisfy this one. */
export const LEADS_DB = join(tmpdir(), `vifnet-e2e-${PORT}`, "leads.db");
