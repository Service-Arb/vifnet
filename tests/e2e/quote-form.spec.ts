import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test, type Locator, type Page } from "@playwright/test";

// The subject is kitstart's FormSelect: the platform's select until the page
// hydrates (the no-JS post is in funnel.spec.ts), the kit's list after — never
// the OS menu, which ignores the palette — in the same box, so nothing moves
// when one becomes the other.
const LABEL = "Type de ménage";

async function fillAndSend(page: Page) {
  const form = page.locator("form#quote");
  await form.locator("input[name=locality]").fill("75015");
  await form.locator("input[name=mobile]").fill("0612345678");
  // The time trap flags anything faster than a person; this is a person.
  await page.waitForTimeout(MIN_FILL_MS + 500);
  await form.locator("button[type=submit]").click();
}

test("with JavaScript the choice is the kit's list, and the form posts it", async ({ page }) => {
  await page.goto("/fr#devis");
  const trigger = page.getByRole("combobox", { name: LABEL });
  await expect(trigger).toBeVisible();
  await expect(page.locator("form#quote select")).toHaveCount(0);
  await trigger.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await list.getByRole("option", { name: "Textiles" }).click();
  await expect(list).toBeHidden();
  await expect(trigger).toHaveText("Textiles");

  const posted = page.waitForRequest(r => r.method() === "POST" && new URL(r.url()).pathname === "/quote");
  await fillAndSend(page);
  expect(new URLSearchParams((await posted).postData() ?? "").get("subject")).toBe("upholstery");
  await page.waitForURL("**/fr/thanks");
});

test("an unchosen subject stops the submit and opens the list", async ({ page }) => {
  await page.goto("/fr#devis");
  await expect(page.getByRole("combobox", { name: LABEL })).toBeVisible();
  let posted = false;
  page.on("request", r => {
    if (r.method() === "POST" && new URL(r.url()).pathname === "/quote") posted = true;
  });
  await fillAndSend(page);
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("combobox", { name: LABEL })).toHaveAttribute("aria-invalid", "true");
  expect(posted).toBe(false);
});

test("the field is the same box before and after hydration", async ({ browser }, testInfo) => {
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
  const kit = scripted.getByRole("combobox", { name: LABEL });
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
