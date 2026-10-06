import { expect, test, type Page } from "@playwright/test";
import { POSTHOG_HOST } from "./env";

// Every page loads, hydrates and settles without a word in the console: a
// hydration mismatch, a failed chunk or a warning from a widget is a defect
// a visitor never reports. LEAD-FORMS-REVIEW-2026-10-03 #19 was React's
// "Each child in a list should have a unique key… render method of
// LeadCapture" — a development-build warning, so this production server
// cannot show that one; it holds the rest.

/** What the console said, errors and warnings, plus anything thrown. */
function listen(page: Page): string[] {
  const said: string[] = [];
  page.on("console", m => {
    if (m.type() === "error" || m.type() === "warning") said.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", e => said.push(`pageerror: ${e.message}`));
  return said;
}

test.beforeEach(async ({ page }) => {
  // The analytics host resolves nowhere (env.ts): answered here, so a beacon's
  // failed fetch is not mistaken for the page's own error.
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 204 }));
});

// The quote card's three forms (`lead_form`), each forced by its link.
for (const path of ["/fr", "/en", "/fr?ab_lead_form=b", "/fr?ab_lead_form=c", "/fr/prices", "/fr/guarantee", "/fr/about", "/fr/thanks"]) {
  test(`${path} loads with a clean console`, async ({ page }) => {
    const said = listen(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(said).toEqual([]);
  });
}

test("the quote card hydrates and opens its lists with a clean console", async ({ page }) => {
  const said = listen(page);
  await page.goto("/fr#devis");
  await expect(page.locator("form#devis-form select")).toHaveCount(0);
  await page.getByRole("combobox", { name: "Prestation" }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#devis-callback").getByText("Rappel", { exact: true }).click();
  await page.waitForLoadState("networkidle");
  expect(said).toEqual([]);
});
