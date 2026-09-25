import { MIN_FILL_MS } from "@evinvest/kitstart";
import { expect, test, type Page } from "@playwright/test";

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
  const box = async (javaScriptEnabled: boolean) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: testInfo.project.use.viewport ?? null });
    const page = await context.newPage();
    await page.goto(`${testInfo.project.use.baseURL ?? ""}/fr#devis`);
    const control = javaScriptEnabled ? page.getByRole("combobox", { name: LABEL }) : page.locator("form#quote select[name=subject]");
    await expect(control).toBeVisible();
    const rect = await control.evaluate(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { width: r.width, height: r.height, x: r.x, border: style.borderTopWidth, radius: style.borderTopLeftRadius };
    });
    await context.close();
    return rect;
  };
  expect(await box(true)).toEqual(await box(false));
});
