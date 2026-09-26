import { expect, test } from "@playwright/test";

// The sub-pages as a visitor reaches them: through the header, in both
// languages, each handing its action to the home page's form. Their look is
// sections.spec's.

const PAGES = [
  { path: "prices", fr: "Chaque ménage, chaque prix.", en: "Every clean, every price." },
  { path: "guarantee", fr: "Pas satisfait ? Nous revenons gratuitement.", en: "Not happy? We come back free." },
  { path: "about", fr: "L’équipe à votre porte.", en: "The team at your door." },
] as const;

for (const locale of ["fr", "en"] as const) {
  for (const sub of PAGES) {
    test(`/${locale}/${sub.path} is served with its head, and noindex before launch`, async ({ page }) => {
      const response = await page.goto(`/${locale}/${sub.path}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveText(sub[locale]);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }
}

test("the header leads from the home page to each sub-page and back", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the header's links show from md; the phone's menu is funnel.spec's");
  await page.goto("/fr");
  const nav = page.locator("header nav").first();
  for (const [label, path] of [
    ["Tarifs", "/fr/prices"],
    ["Garantie", "/fr/guarantee"],
    ["À propos", "/fr/about"],
  ] as const) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
  }
  await nav.getByRole("link", { name: "Avis", exact: true }).click();
  await expect(page).toHaveURL("/fr#avis");
  await expect(page.locator("#avis")).toBeInViewport();
});

test("the phone's menu lists the sub-pages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the burger is the phone's");
  await page.goto("/en/about");
  await page.locator("[data-band=menu-toggle]").click();
  const menu = page.locator("#nav-menu-panel");
  for (const label of ["Pricing", "Guarantee", "Reviews", "About"]) await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
});

test("the proof card's action opens the home page's form", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the proof card shows from lg");
  await page.goto("/fr/guarantee");
  await page.locator("[data-band=proof]").getByRole("link").click();
  await expect(page).toHaveURL("/fr#devis");
  await expect(page.locator("form#quote")).toBeVisible();
});

test("the proof card and the map are not on a phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the phone's layout");
  await page.goto("/fr/about");
  await expect(page.locator("[data-band=proof]")).toBeHidden();
  await expect(page.locator("#zone [data-state]")).toBeHidden();
});

test("the map asks Google for nothing until it is clicked", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the map shows from md");
  const google: string[] = [];
  page.on("request", r => {
    if (new URL(r.url()).hostname.endsWith("google.com")) google.push(r.url());
  });
  // The page's own requests are over before the click, so any Google request
  // counted at the check is the page's, not the map's.
  await page.goto("/en/about#zone", { waitUntil: "networkidle" });
  expect(google).toEqual([]);
  await page.locator("#zone").getByRole("button", { name: /Show the map/ }).click();
  await expect(page.locator('#zone iframe[title="Map of Boise, Idaho"]')).toHaveAttribute("src", /google\.com\/maps\?q=Boise/);
});

test("the price table keeps its caption and drops What's included on a phone", async ({ page }, testInfo) => {
  await page.goto("/en/prices#tarifs");
  const table = page.getByRole("table", { name: "What each clean costs" });
  await expect(table).toBeVisible();
  await expect(table.getByRole("rowheader")).toHaveCount(4);
  const included = table.getByRole("columnheader", { name: "What's included" });
  if (testInfo.project.name === "mobile") await expect(included).toBeHidden();
  else await expect(included).toBeVisible();
});

test("the language link keeps the reader on the sub-page", async ({ page }) => {
  await page.goto("/fr/prices");
  await page.locator("footer#footer").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/prices/);
  await expect(page.locator("h1")).toHaveText("Every clean, every price.");
});
