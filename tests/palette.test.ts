import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brandFromToml, readContract, renderPalette } from "@evinvest/uikit/palette";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

// `app/brand.css` is generated (`npm run palette`) and committed so `next build`
// needs no step before it. This keeps the committed copy honest.
describe("the brand palette", () => {
  it("is the generator's output for assets/brand.toml, byte for byte", () => {
    const contract = readContract(read("node_modules/@evinvest/uikit/styles/tokens.css"));
    const expected = renderPalette("vifnet", brandFromToml(read("assets/brand.toml")), contract, "brand.toml");
    expect(read("app/brand.css")).toBe(expected);
  });
});
