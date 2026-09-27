import { expect, type Page, test } from "@playwright/test";

// The phone's menu is an overlay: opening it must not move the page. It once
// sat in the sticky header's flow, so opening it grew the header — at the top
// the page visibly slid down, lower down scroll anchoring scrolled it by the
// menu's height. Each of the ways out closes it.

/** Where the page stands: its scroll and where the first band of `main` is drawn. */
function position(page: Page) {
  return page.evaluate(() => ({
    scrollY: window.scrollY,
    top: document.querySelector("main > *")?.getBoundingClientRect().top ?? Number.NaN,
  }));
}

const toggle = (page: Page) => page.locator("[data-band=menu-toggle]");
const panel = (page: Page) => page.locator("#nav-menu-panel");

/**
 * A finger on the burger. Not `locator.click()`: that first scrolls its target
 * into view, and Chrome's scroll-into-view of a stuck sticky element moves the
 * page on its own — the very movement under test.
 */
async function tap(page: Page) {
  const box = await toggle(page).boundingBox();
  if (!box) throw new Error("the burger is not drawn");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Two frames: a wheel scrolls the page, if it may, by the next paint. */
function settle(page: Page) {
  return page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

test.describe("the phone's menu", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the burger is the phone's");
    await page.goto("/fr");
  });

  for (const [where, y] of [
    ["at the top of the page", 0],
    ["halfway down the page", 1500],
  ] as const) {
    test(`opens over the page without moving it, ${where}`, async ({ page }) => {
      await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), y);
      const before = await position(page);
      expect(before.scrollY).toBe(y);

      await tap(page);
      await expect(panel(page).getByRole("link", { name: "Avis" })).toBeVisible();
      await expect(page.locator("[data-nav-menu] [data-dismiss]")).toBeVisible();
      expect(await position(page)).toEqual(before);

      // The page behind is locked: a wheel over the scrim does not scroll it.
      await page.mouse.move(195, 800);
      await page.mouse.wheel(0, 400);
      await settle(page);
      await page.waitForTimeout(300);
      expect(await position(page)).toEqual(before);

      await tap(page);
      await expect(panel(page)).toBeHidden();
      expect(await position(page)).toEqual(before);

      // The same wheel with the menu closed does scroll: the check above can fail.
      await page.mouse.move(195, 800);
      await page.mouse.wheel(0, 400);
      await expect.poll(async () => (await position(page)).scrollY).toBeGreaterThan(y);
    });
  }

  test("closes on following one of its links, and the band lands below the bar", async ({ page }) => {
    await tap(page);
    await panel(page).getByRole("link", { name: "Avis" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(page).toHaveURL("/fr#avis");
    // Anchors clear the sticky bar (65px) rather than land under it.
    await expect.poll(() => page.locator("#avis").evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(65);
  });

  test("closes on a press on the scrim, without acting on the page beneath", async ({ page }) => {
    // A point where, with the menu closed, a control of the page lies (the
    // hero's form), below where the open panel reaches: the scrim is all that
    // stands between the press and it.
    const spot = await page.evaluate(() => {
      const control = "a[href], button, input, select, textarea, summary, label";
      for (let y = 420; y < 820; y += 10)
        for (let x = 20; x < 370; x += 10) {
          const hit = document.elementFromPoint(x, y)?.closest(control);
          if (hit && !hit.closest("header")) {
            hit.setAttribute("data-under-scrim", "");
            return { x, y };
          }
        }
      return null;
    });
    if (!spot) throw new Error("no control of the page under the scrim to guard");
    const under = page.locator("[data-under-scrim]");

    await tap(page);
    await expect(page.locator("[data-nav-menu] [data-dismiss]")).toBeVisible();
    await page.mouse.click(spot.x, spot.y);
    await expect(panel(page)).toBeHidden();
    await expect(page).toHaveURL("/fr");
    expect(await under.evaluate(el => el.contains(document.activeElement))).toBe(false);
  });

  test("closes when Tab leaves its last link", async ({ page }) => {
    await tap(page);
    const links = panel(page).getByRole("link");
    await links.last().focus();
    await page.keyboard.press("Tab");
    await expect(panel(page)).toBeHidden();
    expect(await page.evaluate(() => document.querySelector("[data-nav-menu]")?.contains(document.activeElement))).toBe(false);
  });

  test("closes on Escape and hands focus back to the burger", async ({ page }) => {
    await tap(page);
    await panel(page).getByRole("link", { name: "Avis" }).focus();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test("closes when the viewport grows to where the row shows the nav", async ({ page }) => {
    await tap(page);
    await expect(panel(page)).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 844 });
    await expect(page.locator("[data-nav-menu]")).not.toHaveAttribute("open");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("visible");
  });
});
