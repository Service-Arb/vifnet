import { expect, test, type Locator, type Page } from "@playwright/test";
import { abState } from "./env";

// The card's three forms against the Figma page "Lead form A/B" (77:3531),
// drawn with kitstart's parts only: the heights the frames give, where the
// kit can draw them, and the rows the tiles and fields sit in. Pixel
// baselines miss it off Linux; these do not. The mock panel gives the place
// no phone and no WhatsApp, so the channel row is "Rappel" alone — the same
// 42 px row the frames draw with two buttons.

const card = (page: Page) => page.locator("#devis");
const form = (page: Page) => page.locator("form#devis-form");
const hydrated = (page: Page) => expect(form(page).locator("select")).toHaveCount(0);
// The kit's Field a control sits in.
const fieldOf = (control: Locator) => control.locator("xpath=ancestor::*[@data-slot='field'][1]");
const rect = (el: Locator) =>
  el.evaluate(node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
  });
const answer = (page: Page, name: string | RegExp) => card(page).getByRole("radio", { name, exact: typeof name === "string" }).click();

/** The card's height, and the submit's bottom from the card's top. */
async function geometry(page: Page): Promise<{ height: number; submitBottom: number | null }> {
  const box = await rect(card(page));
  const submit = form(page).locator("button[type=submit]");
  const shown = (await submit.count()) > 0 && (await submit.first().isVisible());
  return { height: Math.round(box.height), submitBottom: shown ? Math.round((await rect(submit.first())).bottom - box.y) : null };
}

/** The tiles of one question, by the row they sit on. */
async function rows(question: Locator): Promise<number[]> {
  const tops = await question.locator("label > span").evaluateAll(spans => spans.map(s => Math.round(s.getBoundingClientRect().y)));
  return [...new Set(tops)].map(y => tops.filter(t => t === y).length);
}
const question = (page: Page, input: string) => form(page).locator("fieldset", { has: page.locator(`input[name=estimate_${input}]`) });

test.describe("lead_form a (compact)", () => {
  test("answered, the card is the frame's height and the button where the frame puts it", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await answer(page, "2 chambres");
    await answer(page, "40 à 70 m²");
    await answer(page, "Toutes les 2 semaines");
    // 77:3611 (1440): 690 tall, the button's bottom at 600. 77:3533 (390) draws
    // 736 and 646, with "≈ 77 €"; Instrument Sans has no ≈, and "env. 77 €" is
    // wide enough to push "Détail" to a line of its own at 390: one row (24 px) more.
    const want = testInfo.project.name === "desktop" ? { height: 690, submitBottom: 600 } : { height: 760, submitBottom: 670 };
    expect(await geometry(page)).toEqual(want);
    await expect(form(page).locator("[data-price-cents]")).toHaveText("env. 77 €");
    await expect(form(page).locator("[data-credit-cents]")).toContainText("38,50 € après crédit d’impôt");
  });

  test("each question's answers on one row, in short words on the phone", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    expect(await rows(question(page, "bedrooms"))).toEqual([6]);
    expect(await rows(question(page, "surface"))).toEqual([4]);
    expect(await rows(question(page, "frequency"))).toEqual([4]);
    const desktop = testInfo.project.name === "desktop";
    await expect(question(page, "surface").getByText(desktop ? "40 à 70 m²" : "40–70", { exact: true })).toBeVisible();
    await expect(question(page, "frequency").getByText(desktop ? "Toutes les 2 semaines" : "2 sem.", { exact: true })).toBeVisible();
    // The bedrooms are "1 … 5+" on desktop too, as the frame draws them.
    await expect(question(page, "bedrooms").getByText("5+", { exact: true })).toBeVisible();
  });

  test("the postcode and the phone share a row on desktop, the line under the phone in its column", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    const postcode = await rect(fieldOf(form(page).locator("input[name=locality]")));
    const phone = await rect(fieldOf(form(page).locator("input[name=mobile]")));
    const line = await rect(card(page).getByText("Numéro gardé entre nous · rappel sous 15 min."));
    expect([postcode.height, phone.height]).toEqual([50, 50]);
    if (testInfo.project.name === "desktop") {
      expect(phone.y).toBe(postcode.y);
      expect(line.x).toBeGreaterThanOrEqual(phone.x);
    } else {
      expect(phone.y).toBe(postcode.bottom + 12);
      expect(phone.width).toBe(postcode.width);
    }
    expect(Math.round(line.y - phone.bottom)).toBe(6);
  });

  test("the callback's phone Field stays 50 px", async ({ page }) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await page.locator("#devis-callback").getByText("Rappel", { exact: true }).click();
    const phone = page.locator("form#devis-callback-form input[name=mobile]");
    await expect(phone).toBeVisible();
    expect((await rect(fieldOf(phone))).height).toBe(50);
  });
});

test.describe("lead_form b (steps)", () => {
  test.use({ storageState: abState("b") });

  test("one question a screen at the frames' heights, the heading on the first only", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop", "the frames of every screen are the phone's (81:3566 … 81:3700)");
    await page.goto("/fr#devis");
    await hydrated(page);
    const heading = card(page).getByRole("heading", { name: "Votre devis gratuit" });
    await expect(heading).toBeVisible();
    // 81:3566: the services as a list of four 52 px tiles; no channel row before the phone.
    expect(await geometry(page)).toEqual({ height: 436, submitBottom: null });
    await answer(page, "Ménage standard");
    await expect(heading).toBeHidden();
    // 81:3594: the bedrooms 3 to a row.
    expect(await rows(question(page, "bedrooms"))).toEqual([3, 3]);
    expect((await geometry(page)).height).toBe(318);
    await answer(page, "2 chambres");
    // 81:3627: the surfaces 2 to a row.
    expect(await rows(question(page, "surface"))).toEqual([2, 2]);
    expect((await geometry(page)).height).toBe(318);
    await answer(page, "40 à 70 m²");
    // 81:3660: the frequencies one a line, each with its price.
    await expect(question(page, "frequency").locator("label").first()).toContainText("72 €");
    await answer(page, /^Toutes les 2 semaines/);
    await expect(form(page).locator("[data-price-cents]")).toHaveText("env. 77 €");
    await expect(form(page).locator("input[name=locality]")).toBeFocused();
  });
});

test.describe("lead_form c (price first)", () => {
  test.use({ storageState: abState("c") });

  test("the size first, at the frame's height, with nothing to go back to", async ({ page }, testInfo) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await expect(card(page).getByRole("heading", { name: "Votre devis gratuit" })).toBeVisible();
    await expect(card(page).getByRole("button", { name: "Retour" })).toBeHidden();
    await expect(card(page).getByRole("button", { name: "Voir les prix" })).toBeVisible();
    // 84:3596: 4 then 2 + "Je ne sais pas" over two columns; 3 then 1 + it.
    expect(await rows(question(page, "bedrooms"))).toEqual([4, 3]);
    expect(await rows(question(page, "surface"))).toEqual([3, 2]);
    if (testInfo.project.name !== "desktop") expect(await geometry(page)).toEqual({ height: 488, submitBottom: null });
    // The frame's bar: a third of the way.
    const bar = await rect(card(page).locator("[data-slot=progress]"));
    const fill = await rect(card(page).locator("[data-slot=progress-indicator]"));
    expect(Math.round(((fill.x + fill.width - bar.x) / bar.width) * 100)).toBe(33);
  });

  test("the frequencies as priced cards, the cheapest regular one badged", async ({ page }) => {
    await page.goto("/fr#devis");
    await hydrated(page);
    await answer(page, "2 chambres");
    await answer(page, "40 à 70 m²");
    const weekly = question(page, "frequency").locator("label", { hasText: "Chaque semaine" });
    await expect(weekly).toContainText("Le plus avantageux");
    await expect(weekly).toContainText("72 €");
    await expect(question(page, "frequency").locator("label", { hasText: "Le plus avantageux" })).toHaveCount(1);
  });
});
