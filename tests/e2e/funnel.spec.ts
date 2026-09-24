import { DatabaseSync } from "node:sqlite";
import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test } from "@playwright/test";
import { LEADS_DB } from "./env";

// The funnel's floor: the form must submit before any JavaScript has loaded,
// and it is the only channel this site has (no phone, no WhatsApp yet). A
// regression here is invisible to every other test and costs every lead.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the quote form posts, gets a 303 and the lead is stored", async ({ page }, testInfo) => {
    // A number no other test (or project) submits, so the row found is this one.
    const mobile = `06${String(Date.now() % 1e8).padStart(8, "0")}`;
    const locality = `75015-${testInfo.project.name}`;

    await page.goto("/fr#devis");
    const form = page.locator("form#quote");
    await form.locator("select[name=subject]").selectOption("upholstery");
    await form.locator("input[name=surface_m2]").fill("65");
    await form.locator("input[name=locality]").fill(locality);
    await form.locator("input[name=mobile]").fill(mobile);
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
      expect(row).toEqual({ job: "upholstery", zip: locality, location_id: "vifnet", spam_verdict: null, extras: JSON.stringify({ surface_m2: "65" }) });
    } finally {
      db.close();
    }
  });

  test("the page offers no phone or WhatsApp link while the card has none", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator('a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
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

  test("the slider is off until the script runs", async ({ page }) => {
    await page.goto("/fr#avant-apres");
    await expect(page.getByRole("slider")).toBeDisabled();
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

test("a service link picks its service in the form", async ({ page }) => {
  await page.goto("/fr#prestations");
  await page.locator("#prestations li", { hasText: "Textiles" }).getByRole("link").click();
  await expect(page).toHaveURL(/#devis$/);
  await expect(page.locator("form#quote select[name=subject]")).toHaveValue("upholstery");
});

test("the before/after slider moves with the keyboard", async ({ page }) => {
  await page.goto("/fr#avant-apres");
  const slider = page.getByRole("slider");
  await expect(slider).toBeEnabled();
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "Avant 51 %");
  await page.getByRole("button", { name: /Moquette/ }).click();
  await expect(slider).toHaveAttribute("aria-valuetext", "Avant 50 %");
});
