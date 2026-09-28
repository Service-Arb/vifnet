import { DatabaseSync } from "node:sqlite";
import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test, type Page } from "@playwright/test";
import { abState, LEADS_DB, POSTHOG_HOST } from "./env";

// Experiment `quote_single_step` (docs/EXPERIMENTS.md): b is the quote card
// as one step. The rest of the suite is pinned to a, the frame.

type Sent = { event: string; properties: Record<string, unknown> };

/** Every beacon the page sends to the (unreachable) PostHog host, as sent. */
async function beacons(page: Page): Promise<Sent[]> {
  const sent: Sent[] = [];
  page.on("request", request => {
    if (!request.url().startsWith(POSTHOG_HOST)) return;
    const body = request.postData();
    if (body) sent.push(JSON.parse(body) as Sent);
  });
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 200, body: "1" }));
  return sent;
}

const ours = (sent: Sent[], event: string) => sent.filter(s => s.event === event).map(s => s.properties);

const card = (page: Page) => page.locator("[data-band=quote-card]");

// The rate limit counts 5 leads per address; the suite's other submissions
// come from 127.0.0.1, so each test here posts from an address of its own.
test.describe("variant b", () => {
  test.use({ storageState: abState("b"), extraHTTPHeaders: { "x-forwarded-for": "10.9.0.1" } });

  test("is one step: no Continue, no bedrooms, and the card reaches Done", async ({ page }) => {
    const sent = await beacons(page);
    await page.goto("/fr#devis");
    await expect(page.locator("form#quote select")).toHaveCount(0);
    await expect(card(page).getByRole("button", { name: "Continuer →" })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Chambres" })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Prestation" })).toBeVisible();

    const form = page.locator("form#quote");
    await form.locator("input[name=name]").fill("Camille Martin");
    await form.locator("input[name=mobile]").fill("06 22 33 44 55");
    await form.locator("input[name=locality]").fill("69003");
    await page.waitForTimeout(MIN_FILL_MS + 500);
    await card(page).getByRole("button", { name: "Recevoir mon devis gratuit →" }).click();
    await expect(card(page).getByRole("status")).toContainText("C’est noté, Camille");

    await expect.poll(() => ours(sent, "experiment_exposed")).toEqual([
      expect.objectContaining({ experiment: "quote_single_step", variant: "b", forced: false, brand_id: "vifnet", location_id: "vifnet" }),
    ]);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false, extraHTTPHeaders: { "x-forwarded-for": "10.9.0.2" } });

    test("posts its four fields, gets a 303 and the lead is stored", async ({ page }, testInfo) => {
      const mobile = `07${String(Date.now() % 1e8).padStart(8, "0")}`;
      await page.goto("/fr#devis");
      const form = page.locator("form#quote");
      await form.locator("input[name=name]").fill("Camille Martin");
      await form.locator("input[name=mobile]").fill(mobile);
      await form.locator("input[name=locality]").fill(`69003-${testInfo.project.name}`);
      await form.locator("select[name=subject]").selectOption("move");
      await expect(form.locator("select[name=bedrooms]")).toHaveCount(0);
      await page.waitForTimeout(MIN_FILL_MS + 500);
      await form.locator("button[type=submit]").click();
      await page.waitForURL("**/fr/thanks");

      const db = new DatabaseSync(LEADS_DB, { readOnly: true });
      try {
        const row = db.prepare("SELECT job, location_id, spam_verdict, extras FROM leads WHERE mobile = ?").get(mobile);
        expect(row).toEqual({ job: "move", location_id: "vifnet", spam_verdict: null, extras: JSON.stringify({ name: "Camille Martin" }) });
      } finally {
        db.close();
      }
    });
  });
});

test("the control's events carry the experiment and its variant", async ({ page }) => {
  const sent = await beacons(page);
  await page.goto("/fr#devis");
  await expect(page.locator("form#quote select")).toHaveCount(0);
  const form = page.locator("form#quote");
  await form.locator("input[name=name]").fill("Amanda Reyes");
  await form.locator("input[name=mobile]").fill("06 12 34 56 78");
  await form.locator("input[name=locality]").fill("75015");
  await card(page).getByRole("button", { name: "Continuer →" }).click();
  await page.locator("#demande a[data-intent=form_open]").click();
  // A call tap, kept from leaving for the dialer: our listener runs in the capture phase first.
  await page.evaluate(() => {
    document.addEventListener("click", e => e.preventDefault());
    document.querySelector<HTMLAnchorElement>('a[href^="tel:"]')?.click();
  });

  const base = { experiment: "quote_single_step", variant: "a", forced: false, brand_id: "vifnet" };
  await expect.poll(() => ours(sent, "experiment_exposed")).toEqual([expect.objectContaining(base)]);
  await expect.poll(() => ours(sent, "experiment_step")).toEqual([expect.objectContaining({ ...base, step: 2 })]);
  await expect
    .poll(() => ours(sent, "experiment_contact").map(p => p["channel"]))
    .toEqual(["form_open", "phone"]);
  for (const p of ours(sent, "experiment_contact")) expect(p).toMatchObject(base);
});

test.describe("a forced visit", () => {
  test.use({ storageState: abState("a") });

  test("renders the variant asked for, and marks the browser as QA", async ({ page, context }) => {
    const sent = await beacons(page);
    await page.goto("/fr?ab_quote_single_step=b#devis");
    await expect(card(page).getByRole("button", { name: "Continuer →" })).toHaveCount(0);
    await expect.poll(() => ours(sent, "experiment_exposed")).toEqual([expect.objectContaining({ variant: "b", forced: true })]);
    const jar = Object.fromEntries((await context.cookies()).map(c => [c.name, c.value]));
    expect(jar).toMatchObject({ ab_quote_single_step: "b", ab__qa: "1" });
  });
});

test.describe("a new visitor", () => {
  test.use({ storageState: abState(null) });

  test("gets a sticky assignment on the home page, and none on a sub-page", async ({ request }) => {
    const home = await request.get("/fr", { headers: { cookie: "" } });
    expect(home.headers()["set-cookie"] ?? "").toMatch(/ab_quote_single_step=[ab];/);
    const sub = await request.get("/fr/prices", { headers: { cookie: "" } });
    expect(sub.headers()["set-cookie"] ?? "").not.toContain("ab_");
  });

  test("a crawler gets the control and no cookie", async ({ request }) => {
    const response = await request.get("/fr", { headers: { cookie: "", "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } });
    expect(response.status()).toBe(200);
    expect(response.headers()["set-cookie"] ?? "").not.toContain("ab_");
    expect(await response.text()).toContain('name="bedrooms"');
  });
});
