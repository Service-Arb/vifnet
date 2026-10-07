import { expect, test, type Browser, type Page } from "@playwright/test";
import { abState, POSTHOG_HOST } from "./env";

// kitstart's QA menu (docs/EXPERIMENTS.md, "Forcing a variant"): a forced
// visit gets the chip; a visitor without `ab__qa` downloads none of it, and
// the home page with no force ends the test visit.

const MARKER = "data-ab-switcher";
const chip = (page: Page) => page.getByRole("button", { name: "A/B test switcher" });

/** Every script the page loads, by URL, with whether its body carries the panel's marker. */
function scripts(page: Page): Map<string, Promise<boolean>> {
  const seen = new Map<string, Promise<boolean>>();
  page.on("response", response => {
    if (response.request().resourceType() !== "script") return;
    seen.set(response.url(), response.text().then(body => body.includes(MARKER), () => false));
  });
  return seen;
}

/** The URLs of the chunks that carry the panel, as a forced visit downloads them. */
async function panelChunks(browser: Browser): Promise<string[]> {
  const context = await browser.newContext({ storageState: abState("a") });
  try {
    const page = await context.newPage();
    const seen = scripts(page);
    await page.goto("/fr?ab_lead_form=a");
    await expect(chip(page)).toBeVisible();
    const marked = await Promise.all([...seen].map(async ([url, has]) => ((await has) ? url : null)));
    return marked.filter(url => url !== null);
  } finally {
    await context.close();
  }
}

/**
 * Resolves once the page the next navigation loads has sent its exposure
 * beacon: an effect of the same hydration as the gate's, so by then the gate
 * has decided. Only beacons after the main frame navigates count — a late one
 * from the page being left must not pass for the new page's.
 */
async function gateDecided(page: Page): Promise<{ exposed: Promise<unknown> }> {
  let navigated = false;
  page.on("framenavigated", frame => {
    if (frame === page.mainFrame()) navigated = true;
  });
  const exposed = page.waitForRequest(r => navigated && r.url().startsWith(POSTHOG_HOST) && (r.postData() ?? "").includes("experiment_exposed"));
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 200, body: "1" }));
  // Wrapped: an async function returning the bare promise would be awaited through.
  return { exposed };
}

/** The cookies the next document request carries, by name. */
async function nextDocumentCookies(page: Page): Promise<Record<string, string>> {
  const request = await page.waitForRequest(r => r.isNavigationRequest() && r.frame() === page.mainFrame());
  const header = (await request.allHeaders())["cookie"] ?? "";
  return Object.fromEntries(header.split("; ").filter(Boolean).map(pair => pair.split("=", 2) as [string, string]));
}

test("a forced visit shows the chip with the forced arm", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=b");
  // The badges, in the menu's order: lead_form, booking_provider, then lead_channel.
  await expect(chip(page)).toHaveText(/^A\/B\s*b\s*a\s*a$/);
});

test.describe("a new visitor", () => {
  test.use({ storageState: abState(null) });

  test("gets no chip and never downloads the panel", async ({ page, browser }) => {
    const chunks = await panelChunks(browser);
    expect(chunks.length).toBeGreaterThan(0);

    const seen = scripts(page);
    const { exposed } = await gateDecided(page);
    await page.goto("/fr");
    await exposed;

    await expect(chip(page)).toHaveCount(0);
    await expect(page.locator(`[${MARKER}]`)).toHaveCount(0);
    expect([...seen.keys()].filter(url => chunks.includes(url))).toEqual([]);
    const marked = await Promise.all([...seen.values()]);
    expect(marked.filter(Boolean)).toEqual([]);
  });
});

test("the menu switches the lead form to price first", async ({ page }) => {
  const card = page.locator("#devis");
  await page.goto("/fr?ab_lead_form=a#devis");
  await expect(card.getByRole("radio", { name: "Je ne sais pas" })).toHaveCount(0);

  await chip(page).click();
  const menu = page.getByRole("dialog", { name: "A/B test switcher" });
  await expect(menu.getByRole("group", { name: "Lead form" }).getByRole("button", { name: "Compact" })).toHaveAttribute("aria-pressed", "true");
  await menu.getByRole("group", { name: "Lead form" }).getByRole("button", { name: "Price first" }).click();

  await expect(page).toHaveURL(/[?&]ab_lead_form=c(&|#|$)/);
  await expect(card.getByRole("radio", { name: "Je ne sais pas" }).first()).toBeVisible();
  await expect(chip(page)).toHaveText(/^A\/B\s*c\s*a\s*a$/);
});

test("the menu calls lead_channel inactive on a place with no WhatsApp", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=a");
  await chip(page).click();
  const menu = page.getByRole("dialog", { name: "A/B test switcher" });
  await expect(menu.getByRole("group", { name: "Lead channel — inactive here (no WhatsApp)" })).toBeVisible();
});

test.describe("from the menu", () => {
  const button = (page: Page, name: string) => page.getByRole("dialog", { name: "A/B test switcher" }).getByRole("button", { name });

  test("Reset ends the test visit: the own arms back, and no chip after the reload", async ({ page, context }) => {
    await page.goto("/fr?ab_lead_form=b");
    await chip(page).click();
    const sent = nextDocumentCookies(page);
    const { exposed } = await gateDecided(page);
    await button(page, "Reset").click();

    // What the reload asks with: no arm, and the own arms in the QA mark for the proxy to give back.
    const cookies = await sent;
    expect(cookies).not.toHaveProperty("ab_lead_form");
    expect(cookies).not.toHaveProperty("ab_booking_provider");
    expect(cookies).not.toHaveProperty("ab_lead_channel");
    expect(cookies).toMatchObject({ ab__qa: "lead_form.a~booking_provider.a~lead_channel.a" });
    await expect(page).toHaveURL(url => !url.searchParams.has("ab_lead_form"));
    await exposed;
    await expect(chip(page)).toHaveCount(0);
    // booking_provider on a although the panel draws every new arm on b (mock-panel.mjs): given back, not drawn.
    const jar = Object.fromEntries((await context.cookies()).map(c => [c.name, c.value]));
    expect(jar).toMatchObject({ ab_lead_form: "a", ab_booking_provider: "a", ab_lead_channel: "a" });
    expect(jar).not.toHaveProperty("ab__qa");
    expect(jar).not.toHaveProperty("ab__qa_off");
  });

  test("Leave test drops the QA mark, and the chip with it", async ({ page, context }) => {
    await page.goto("/fr?ab_lead_form=b");
    await chip(page).click();
    const sent = nextDocumentCookies(page);
    const { exposed } = await gateDecided(page);
    await button(page, "Leave test").click();

    expect(await sent).not.toHaveProperty("ab__qa");
    await expect(page).toHaveURL(url => !url.searchParams.has("ab_lead_form"));
    await exposed;
    await expect(chip(page)).toHaveCount(0);
    expect((await context.cookies()).map(c => c.name)).not.toContain("ab__qa");
  });

  test("Leave test from the form's anchor lands on the plain home page, its anchor dropped", async ({ page, context }) => {
    // A menu shows on a forced URL only (the plain home page ends the test
    // visit), so Leave's target differs by its query anyway; what is left to
    // hold is that kitstart drops the anchor rather than scroll to it.
    await page.goto("/fr?ab_lead_form=b#devis");
    await chip(page).click();
    const { exposed } = await gateDecided(page);
    const loaded = page.waitForEvent("load");
    await button(page, "Leave test").click();

    await loaded;
    await exposed;
    await expect(page).toHaveURL(url => url.pathname === "/fr" && url.search === "" && url.hash === "");
    await expect(chip(page)).toHaveCount(0);
    expect((await context.cookies()).map(c => c.name)).not.toContain("ab__qa");
  });
});
