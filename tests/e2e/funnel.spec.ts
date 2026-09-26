import { DatabaseSync } from "node:sqlite";
import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test } from "@playwright/test";
import { LEADS_DB } from "./env";

// The funnel's floor: the form must submit before any JavaScript has loaded.
// Without a script the card's two steps are one form. A regression here is
// invisible to every other test and costs every lead.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the quote form posts every field, gets a 303 and the lead is stored", async ({ page }, testInfo) => {
    // A number no other test (or project) submits, so the row found is this one.
    const mobile = `06${String(Date.now() % 1e8).padStart(8, "0")}`;
    const locality = `75015-${testInfo.project.name}`;

    await page.goto("/fr#devis");
    const form = page.locator("form#quote");
    // No "Continue" without a script: both steps show, and submit is the only button.
    await expect(form.getByRole("button", { name: "Continuer →" })).toBeHidden();
    await form.locator("input[name=name]").fill("Amanda Reyes");
    await form.locator("input[name=mobile]").fill(mobile);
    await form.locator("input[name=locality]").fill(locality);
    // Without a script the selects are the platform's own, which post as they are.
    await form.locator("select[name=bedrooms]").selectOption("2");
    await form.locator("select[name=subject]").selectOption("deep");
    // The time trap flags anything faster than a person; this is a person.
    await page.waitForTimeout(MIN_FILL_MS + 500);

    const posted = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/quote");
    await form.locator("button[type=submit]").click();
    expect((await posted).status()).toBe(303);
    await page.waitForURL("**/fr/thanks");
    await expect(page.locator("h1")).toContainText("Merci");

    // A suspected bot gets the same 303, so the redirect proves nothing: the row does.
    const db = new DatabaseSync(LEADS_DB, { readOnly: true });
    try {
      const row = db.prepare("SELECT job, zip, location_id, spam_verdict, extras FROM leads WHERE mobile = ?").get(mobile);
      expect(row).toEqual({
        job: "deep",
        zip: locality,
        location_id: "vifnet",
        spam_verdict: null,
        extras: JSON.stringify({ name: "Amanda Reyes", bedrooms: "2" }),
      });
    } finally {
      db.close();
    }
  });

  test("the phone links call the frame's sample number, and there is no WhatsApp", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    const phones = page.locator('a[href^="tel:"]');
    await expect(phones.first()).toBeAttached();
    for (const href of await phones.evaluateAll(links => links.map(a => a.getAttribute("href")))) expect(href).toBe("tel:+12085550192");
  });

  test("the phone menu opens and closes without a script", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the burger is the phone's");
    await page.goto("/fr");
    const menu = page.locator("#nav-menu-panel");
    await expect(menu).toBeHidden();
    await page.locator("[data-band=menu-toggle]").click();
    await expect(menu.getByRole("link", { name: "Avis" })).toBeVisible();
    await page.locator("[data-band=menu-toggle]").click();
    await expect(menu).toBeHidden();
  });

  test("a dead path is a 404 rendered on the server, with its headline", async ({ page }) => {
    const response = await page.goto("/fr/nope");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("n’existe pas");
  });

  test("a file path nobody serves is the same 404; the icon is served", async ({ page, request }) => {
    const response = await page.goto("/wp-login.php");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toBeVisible();
    expect((await request.get("/icon.svg")).status()).toBe(200);
  });
});

// No domain yet: nothing may be indexed, whatever the page.
test.describe("before launch", () => {
  test("the page is noindex", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("robots.txt disallows everything", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/^Disallow: \/$/m);
  });

  test("the sitemap lists no URL", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain("<url>");
  });
});

test("a service card picks its service in the form", async ({ page }) => {
  await page.goto("/fr#prestations");
  // Hydrated: before that the click lands on a plain link and picks nothing.
  await expect(page.locator("form#quote select")).toHaveCount(0);
  await page.locator("#prestations li", { hasText: "Grand ménage" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/#devis$/);

  const form = page.locator("form#quote");
  await form.locator("input[name=name]").fill("Jordan Taylor");
  await form.locator("input[name=mobile]").fill("06 12 34 56 78");
  await form.locator("input[name=locality]").fill("75015");
  await page.getByRole("button", { name: "Continuer →" }).click();
  await expect(page.getByRole("combobox", { name: "Prestation" })).toHaveText("Grand ménage");
  await expect(form.locator("input[name=subject]")).toHaveValue("deep");
});

test("the sticky bar slides in after the hero", async ({ page }) => {
  await page.goto("/fr");
  const bar = page.locator("[data-band=sticky]");
  await expect(bar).toHaveAttribute("data-shown", "false");
  await page.mouse.wheel(0, 1500);
  await expect(bar).toHaveAttribute("data-shown", "true");
  await expect(bar.getByRole("link", { name: "Réserver" })).toBeVisible();
});
