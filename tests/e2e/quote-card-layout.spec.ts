import { expect, test, type Locator, type Page } from "@playwright/test";
import { abState } from "./env";

// The card's compact layout (Figma 60:3497, Option A), drawn with kitstart's
// parts only: the contact step's fields two to a row where two fit (the
// desktop card) and stacked on the phone's. `field` is also the part of the
// need's Field and the callback phone's, both in a column the kit draws: there
// the pairing's `basis-48` would be a 192 px height, so those stay 50 px —
// the frame's Field — in both arms of `lead_layout`. Pixel baselines miss it
// off Linux; these do not.

const card = (page: Page) => page.locator("#devis");
const form = (page: Page) => page.locator("form#devis-form");
const hydrated = (page: Page) => expect(form(page).locator("select")).toHaveCount(0);
// The kit's Field a control sits in.
const fieldOf = (control: Locator) => control.locator("xpath=ancestor::*[@data-slot='field'][1]");
const rect = (el: Locator) =>
  el.evaluate(node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

const FIELD_HEIGHT = 50;

async function expectPostcodeAndPhone(page: Page, desktop: boolean) {
  const postcode = await rect(fieldOf(form(page).locator("input[name=locality]")));
  const phone = await rect(fieldOf(form(page).locator("input[name=mobile]")));
  expect(postcode.height).toBe(FIELD_HEIGHT);
  expect(phone.height).toBe(FIELD_HEIGHT);
  if (desktop) {
    expect(phone.y).toBe(postcode.y);
    expect(phone.x).toBeGreaterThan(postcode.x + postcode.width);
  } else {
    expect(phone.y).toBeGreaterThanOrEqual(postcode.y + postcode.height);
    expect(phone.x).toBe(postcode.x);
    expect(phone.width).toBe(postcode.width);
  }
}

test.describe("lead_layout a (single)", () => {
  test("the postcode and the phone share a row where two fit; the need's Field stays 50 px", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    const need = card(page).getByRole("combobox", { name: "Prestation" });
    await expect(need).toBeVisible();
    expect((await rect(fieldOf(need))).height).toBe(FIELD_HEIGHT);
    await expectPostcodeAndPhone(page, testInfo.project.name === "desktop");
  });

  test("a quote pairs the name with the bedrooms where two fit", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await card(page).getByRole("combobox", { name: "Prestation" }).click();
    await page.getByRole("listbox").getByRole("option", { name: "Grand ménage" }).click();
    const name = await rect(fieldOf(form(page).locator("input[name=name]")));
    const bedrooms = await rect(fieldOf(page.getByRole("combobox", { name: "Chambres (facultatif)" })));
    expect(bedrooms.height).toBe(FIELD_HEIGHT);
    if (testInfo.project.name === "desktop") expect(bedrooms.y).toBe(name.y);
    else expect(bedrooms.y).toBeGreaterThanOrEqual(name.y + name.height);
  });

  test("the callback's phone Field stays 50 px", async ({ page }) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await page.locator("#devis-callback").getByText("Rappelez-moi").click();
    const phone = page.locator("form#devis-callback-form input[name=mobile]");
    await expect(phone).toBeVisible();
    expect((await rect(fieldOf(phone))).height).toBe(FIELD_HEIGHT);
  });
});

test.describe("lead_layout b (qualify-first)", () => {
  test.use({ storageState: abState("b") });

  test("the need's tiles are as tall as their grid, and the contact step pairs as in a", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    // The tiles' fieldset wears `field` too: its legend is sr-only, so it is
    // exactly its grid unless the pairing's basis became its height.
    const tiles = form(page).locator("fieldset", { has: page.locator("[data-need-option]") });
    const group = await rect(tiles);
    const grid = await rect(tiles.locator(":scope > div"));
    expect(group.height).toBeLessThanOrEqual(grid.height + 1);
    await card(page).getByRole("radio", { name: "Ménage standard" }).click();
    await expectPostcodeAndPhone(page, testInfo.project.name === "desktop");
  });
});
