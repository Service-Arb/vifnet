import { expect, test, type Browser, type Page } from "@playwright/test";
import { abState, POSTHOG_HOST } from "./env";

// kitstart's QA menu (docs/EXPERIMENTS.md, "Forcing a variant"): a forced
// visit gets the chip; a visitor without `ab__qa` downloads none of it.

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
 * Resolves once the next page has sent its exposure beacon: an effect of the
 * same hydration as the gate's, so by then the gate has decided.
 */
async function gateDecided(page: Page): Promise<{ exposed: Promise<unknown> }> {
  const exposed = page.waitForRequest(r => r.url().startsWith(POSTHOG_HOST) && (r.postData() ?? "").includes("experiment_exposed"));
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
  // The badges, in the menu's order: lead_form, then booking_provider.
  await expect(chip(page)).toHaveText(/^A\/B\s*b\s*a$/);
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
  await expect(chip(page)).toHaveText(/^A\/B\s*c\s*a$/);
});

test.describe("from the menu", () => {
  const button = (page: Page, name: string) => page.getByRole("dialog", { name: "A/B test switcher" }).getByRole("button", { name });

  test("Reset drops the arms and the force, and keeps the visit a test", async ({ page, context }) => {
    await page.goto("/fr?ab_lead_form=b");
    await chip(page).click();
    const sent = nextDocumentCookies(page);
    await button(page, "Reset").click();

    // What the reload asks with: no arm, so the proxy draws one again; still a test visit.
    const cookies = await sent;
    expect(cookies).not.toHaveProperty("ab_lead_form");
    expect(cookies).not.toHaveProperty("ab_booking_provider");
    expect(cookies).toMatchObject({ ab__qa: "1" });
    await expect(page).toHaveURL(url => !url.searchParams.has("ab_lead_form"));
    await expect(chip(page)).toHaveText(/^A\/B\s*[abc]\s*[ab]$/);
    const jar = Object.fromEntries((await context.cookies()).map(c => [c.name, c.value]));
    expect(jar).toMatchObject({ ab__qa: "1" });
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
});
