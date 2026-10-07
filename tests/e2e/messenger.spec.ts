import { expect, test, type Locator, type Page } from "@playwright/test";
import { abState, MESSENGER_PORT, POSTHOG_HOST } from "./env";

// Experiment `lead_channel` (MESSENGER-CHANNELS-SPEC §4, docs/EXPERIMENTS.md):
// a is the control, b–g VF-1 … VF-6 of the Figma page "Lead form A/B",
// messengers v3, each forced by its link. Run against the second server,
// whose place has a WhatsApp number and the bot `vifnet_devis_bot` (env.ts,
// `MESSENGER_PORT`). The frames' rule: inside an arm every state has the
// card's one height — what a state changes is swapped in a fixed slot or laid
// over the card, never pushed under it.

test.use({ baseURL: `http://localhost:${MESSENGER_PORT}`, storageState: abState("a") });

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "the frames are the phone's (390); a computer draws a QR code for WhatsApp instead");
  // The analytics host resolves nowhere: answered, so a beacon is no console error.
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 204 }));
});

/** What the console said, errors and warnings, plus anything thrown. */
function listen(page: Page): string[] {
  const said: string[] = [];
  page.on("console", m => {
    if (m.type() === "error" || m.type() === "warning") said.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", e => said.push(`pageerror: ${e.message}`));
  return said;
}

const card = (page: Page) => page.locator("#devis");

/** The card's height, to the pixel. */
const height = async (page: Page) => Math.round(await card(page).evaluate(node => node.getBoundingClientRect().height));

/** The prefilled message names the lead by the brand's reference (`Réf. VF-7K3F`, Crockford base32). */
const REF = /R%C3%A9f\.%20VF-[0-9A-HJKMNP-TV-Z]{4,8}(&|$)/;
const BOT = /^https:\/\/t\.me\/vifnet_devis_bot\?start=VF-[0-9A-HJKMNP-TV-Z]{4,8}$/;

/** The arm's page, hydrated, the job answered as the frames draw it: the price on the card. */
async function open(page: Page, arm: string): Promise<void> {
  await page.goto(`/fr?ab_lead_channel=${arm}#devis`);
  await expect(page.locator("form#devis-form select")).toHaveCount(0);
  for (const answer of ["2 chambres", "40 à 70 m²", "Toutes les 2 semaines"]) await card(page).getByRole("radio", { name: answer, exact: true }).click();
  await expect(card(page).locator("[data-price-cents]")).toHaveText("env. 77 €");
}

/** The card is `before` tall once `shown` is on screen. */
async function heldAt(page: Page, before: number, shown: Locator): Promise<void> {
  await expect(shown).toBeVisible();
  expect(await height(page)).toBe(before);
}

test("a: the control's card, no messenger arm in it", async ({ page }) => {
  const said = listen(page);
  await open(page, "a");
  await expect(card(page).getByText("Nous vous rappelons en moins de 15 minutes.")).toBeVisible();
  await expect(card(page).getByRole("button", { name: "Réserver" })).toBeVisible();
  await expect(card(page).getByRole("group", { name: "Ou contactez-nous" })).toBeVisible();
  await expect(card(page).getByRole("combobox", { name: "Canal de réponse" })).toHaveCount(0);
  await expect(card(page).locator('a[href^="https://wa.me/"][href*="VF-"]')).toHaveCount(0);
  await expect(card(page).locator('a[href^="https://t.me/"]')).toHaveCount(0);
  expect(said).toEqual([]);
});

test("b (VF-1): the channel select in the phone field; WhatsApp and the call at one height", async ({ page }) => {
  const said = listen(page);
  await open(page, "b");
  const select = card(page).getByRole("combobox", { name: "Canal de réponse" });
  const whatsapp = card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" });
  await expect(select).toHaveText(/WhatsApp/);
  await expect(card(page).getByText("Devis rédigé dans WhatsApp · numéro facultatif.")).toBeVisible();
  await expect(whatsapp).toHaveAttribute("href", REF);
  const before = await height(page);

  await select.click();
  // The menu lies over the card: the card does not grow under it.
  await heldAt(page, before, page.getByRole("option", { name: /^Telegram/ }));
  await page.getByRole("option", { name: /^Appel/ }).click();
  await heldAt(page, before, card(page).getByRole("button", { name: "Réserver" }));
  await expect(card(page).getByText("Numéro gardé entre nous · rappel sous 15 min.")).toBeVisible();

  await select.click();
  await page.getByRole("option", { name: /^WhatsApp/ }).click();
  await heldAt(page, before, whatsapp);
  expect(said).toEqual([]);
});

test("c (VF-2): three tiles over one slot, the slot's height for each", async ({ page }) => {
  const said = listen(page);
  await open(page, "c");
  const tiles = card(page).getByRole("group", { name: "Recevoir mon devis par" });
  await expect(tiles.getByRole("button", { name: "WhatsApp" })).toHaveAttribute("aria-pressed", "true");
  await expect(card(page).getByText("Votre devis est prêt à envoyer")).toBeVisible();
  await expect(card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" })).toHaveAttribute("href", REF);
  const before = await height(page);

  await tiles.getByRole("button", { name: "Telegram" }).click();
  const bot = card(page).getByRole("link", { name: "Ouvrir Telegram" });
  await heldAt(page, before, bot);
  await expect(bot).toHaveAttribute("href", BOT);

  await tiles.getByRole("button", { name: "Appel" }).click();
  await heldAt(page, before, card(page).getByRole("button", { name: "Réserver" }));

  await tiles.getByRole("button", { name: "WhatsApp" }).click();
  await heldAt(page, before, card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" }));
  expect(said).toEqual([]);
});

test("d (VF-3): no phone until «Être rappelé», which swaps in its slot", async ({ page }) => {
  const said = listen(page);
  await open(page, "d");
  await expect(card(page).getByText("Votre devis est prêt : envoyez-le-nous sur WhatsApp.")).toBeVisible();
  await expect(card(page).getByRole("textbox", { name: "Téléphone" })).toHaveCount(0);
  await expect(card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" })).toHaveAttribute("href", REF);
  await expect(card(page).getByRole("link", { name: "Telegram" })).toHaveAttribute("href", BOT);
  const before = await height(page);

  await card(page).getByRole("button", { name: "Être rappelé" }).click();
  await heldAt(page, before, card(page).getByRole("button", { name: "Être rappelé sous 15 min" }));
  await expect(card(page).getByRole("textbox", { name: "Téléphone" })).toBeVisible();

  await card(page).getByRole("button", { name: "Revenir à WhatsApp" }).click();
  await heldAt(page, before, card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" }));
  expect(said).toEqual([]);
});

test("e (VF-4): one button; its drawer lies over the page and the card keeps its height", async ({ page }) => {
  const said = listen(page);
  await open(page, "e");
  await expect(card(page).getByRole("textbox", { name: "Téléphone" })).toHaveCount(0);
  const before = await height(page);

  await card(page).getByRole("button", { name: "Recevoir mon devis" }).click();
  const drawer = page.getByRole("dialog");
  await heldAt(page, before, drawer.getByText("Où recevoir votre devis ?"));
  await expect(drawer.getByRole("link", { name: /^WhatsApp/ })).toHaveAttribute("href", REF);
  await expect(drawer.getByRole("link", { name: /^Telegram/ })).toHaveAttribute("href", BOT);
  await expect(drawer.getByRole("button", { name: /^Être rappelé/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  expect(await height(page)).toBe(before);
  expect(said).toEqual([]);
});

test("f (VF-5): the lede is the channel chip; its menu and the call keep the height", async ({ page }) => {
  const said = listen(page);
  await open(page, "f");
  const chip = card(page).getByRole("combobox", { name: "Canal de réponse" });
  await expect(chip).toHaveText("Réponse sur WhatsApp · 15 min");
  await expect(card(page).getByText("Nous vous rappelons en moins de 15 minutes.")).toHaveCount(0);
  await expect(card(page).getByRole("link", { name: "Recevoir mon devis sur WhatsApp" })).toHaveAttribute("href", REF);
  const before = await height(page);

  await chip.click();
  await heldAt(page, before, page.getByRole("option", { name: /^Telegram/ }));
  await page.getByRole("option", { name: /^Appel/ }).click();
  await expect(chip).toHaveText("Réponse par appel · 15 min");
  await heldAt(page, before, card(page).getByRole("button", { name: "Réserver" }));
  expect(said).toEqual([]);
});

test("g (VF-6): the WhatsApp button with the bot and 📞 beside it; the call swaps in its slot", async ({ page }) => {
  const said = listen(page);
  await open(page, "g");
  await expect(card(page).getByRole("link", { name: "Devis sur WhatsApp" })).toHaveAttribute("href", REF);
  await expect(card(page).getByRole("link", { name: "Telegram" })).toHaveAttribute("href", BOT);
  const before = await height(page);

  await card(page).getByRole("button", { name: "Être rappelé" }).click();
  const back = card(page).getByRole("button", { name: "Revenir à WhatsApp" });
  await heldAt(page, before, back);
  await expect(card(page).getByRole("textbox", { name: "Téléphone" })).toBeVisible();

  await back.click();
  await heldAt(page, before, card(page).getByRole("link", { name: "Devis sur WhatsApp" }));
  expect(said).toEqual([]);
});

test("a forced arm is counted under lead_channel, and lead_form's events say it", async ({ page }) => {
  const sent: { event: string; properties: Record<string, unknown> }[] = [];
  page.on("request", request => {
    const body = request.url().startsWith(POSTHOG_HOST) ? request.postData() : null;
    if (body) sent.push(JSON.parse(body) as (typeof sent)[number]);
  });
  await page.goto("/fr?ab_lead_channel=c#devis");
  const exposed = (experiment: string) => sent.filter(s => s.event === "experiment_exposed" && s.properties["experiment"] === experiment).map(s => s.properties);
  await expect.poll(() => exposed("lead_channel")).toEqual([expect.objectContaining({ experiment: "lead_channel", variant: "c", forced: true })]);
  await expect.poll(() => exposed("lead_form")).toEqual([expect.objectContaining({ experiment: "lead_form", variant: "a", lead_channel: "c" })]);
});
