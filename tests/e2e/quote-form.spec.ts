import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test, type Locator, type Page } from "@playwright/test";

// The quote card is the frame's two steps and its Done state. The selects are
// kitstart's FormSelect: the platform's select until the page hydrates (the
// no-JS post is in funnel.spec.ts), the kit's list after — never the OS menu,
// which ignores the palette — in the same box, so nothing moves when one
// becomes the other.
const SERVICE = "Prestation";

const card = (page: Page) => page.locator("[data-band=quote-card]");

async function stepOne(page: Page) {
  const form = page.locator("form#quote");
  await form.locator("input[name=name]").fill("Amanda Reyes");
  await form.locator("input[name=mobile]").fill("06 12 34 56 78");
  await form.locator("input[name=locality]").fill("75015");
  await card(page).getByRole("button", { name: "Continuer →" }).click();
}

test("step 1 refuses to go on without a name, a number and a postcode", async ({ page }) => {
  await page.goto("/fr#devis");
  await expect(page.locator("form#quote select")).toHaveCount(0);
  await card(page).getByRole("button", { name: "Continuer →" }).click();
  await expect(page.getByText("Encore un détail")).toBeHidden();
  await expect(page.locator("form#quote input[name=name]")).toBeFocused();
});

test("with JavaScript the steps lead to Done, and the form posts every field", async ({ page }) => {
  await page.goto("/fr#devis");
  await expect(page.locator("form#quote select")).toHaveCount(0);
  await stepOne(page);

  const trigger = page.getByRole("combobox", { name: SERVICE });
  await expect(trigger).toHaveText("Ménage standard");
  await expect(page.getByRole("combobox", { name: "Chambres" })).toHaveText("3 chambres");
  await trigger.click();
  const list = page.getByRole("listbox");
  await list.getByRole("option", { name: "Fin de chantier" }).click();
  await expect(list).toBeHidden();
  await expect(trigger).toHaveText("Fin de chantier");

  // The time trap flags anything faster than a person; this is a person.
  await page.waitForTimeout(MIN_FILL_MS + 500);
  const posted = page.waitForRequest(r => r.method() === "POST" && new URL(r.url()).pathname === "/quote");
  await card(page).getByRole("button", { name: "Recevoir mon devis gratuit →" }).click();
  const body = (await posted).postDataBuffer()?.toString("utf8") ?? "";
  for (const field of ["Amanda Reyes", "post-construction", "75015", 'name="bedrooms"']) expect(body).toContain(field);

  // Done in place: the first name and the number as typed, no navigation.
  await expect(card(page).getByRole("status")).toContainText("C’est noté, Amanda");
  await expect(card(page).getByRole("status")).toContainText("06 12 34 56 78");
  await expect(page).toHaveURL(/\/fr(#devis)?$/);
});

test("the select is the same box before and after hydration", async ({ browser }, testInfo) => {
  const open = async (javaScriptEnabled: boolean) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: testInfo.project.use.viewport ?? null });
    const page = await context.newPage();
    await page.goto(`${testInfo.project.use.baseURL ?? ""}/fr#devis`);
    return page;
  };
  const measure = (control: Locator) =>
    control.evaluate(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { width: r.width, height: r.height, x: r.x, border: style.borderTopWidth, radius: style.borderTopLeftRadius };
    });

  // The server's select is a combobox of the same name, so until the page
  // hydrates the role finds it — and hydration detaches it, leaving a
  // measurement of zeros. Measure only once the kit's button has replaced it.
  const scripted = await open(true);
  await expect(scripted.locator("form#quote select")).toHaveCount(0);
  await stepOne(scripted);
  const kit = scripted.getByRole("combobox", { name: SERVICE });
  await expect(kit).toHaveJSProperty("tagName", "BUTTON");
  await expect(kit).toBeVisible();
  const hydrated = await measure(kit);
  await scripted.context().close();

  const bare = await open(false);
  const native = bare.locator("form#quote select[name=subject]");
  await expect(native).toBeVisible();
  const server = await measure(native);
  await bare.context().close();

  expect(hydrated).toEqual(server);
});
