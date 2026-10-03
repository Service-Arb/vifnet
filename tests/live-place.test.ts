import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SAMPLE_PHONE } from "@/shared/config/sample";
import { CONTROL } from "@/shared/lib/experiments";
import { PlaceHome } from "@/views/home";
import { loadPlace } from "@/views/place/server";
import { PlaceSubpage } from "@/views/subpage";

// The panel's place source (`nix run .#local-stack` in the panel repo, or
// LOCATIONS_API_URL in a deploy): what it says about vifnet/vifnet is merged
// over the baked place, and every number on the page follows it.
const SOURCE = "http://panel.test/api/public";
const LIVE = "+33 6 12 34 56 78";

beforeAll(() => {
  // Read once, lazily, by the first page load (`serverEnv`).
  process.env["LOCATIONS_API_URL"] = SOURCE;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function answer(body: unknown) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const params = Promise.resolve({ locale: "fr", location: "vifnet" });
const target = { key: null, host: "https://us.i.posthog.com", brandId: "vifnet" };

async function homeHtml() {
  const { view, copy, renderedAt } = await loadPlace(params);
  return renderToStaticMarkup(createElement(PlaceHome, { view, copy, renderedAt, experiments: { assignment: CONTROL, target } }));
}

describe("a phone from the panel", () => {
  it("is asked for at the source, for vifnet", async () => {
    const fetch = answer({ phone: LIVE, whatsapp: LIVE });
    const { view, copy } = await loadPlace(params);
    expect(fetch).toHaveBeenCalledWith(`${SOURCE}/locations/vifnet?locale=fr`, expect.anything());
    expect(view.place.channels).toEqual({ phone: LIVE, whatsapp: LIVE });
    expect(copy.f.phone).toBe(LIVE);
  });

  it("replaces the frame's sample everywhere the page shows a number", async () => {
    answer({ phone: LIVE });
    const html = await homeHtml();
    expect(html).not.toContain(SAMPLE_PHONE.href);
    expect(html).not.toContain(SAMPLE_PHONE.display);
    // The header, the phone menu, the FAQ, the gold band, the footer, the
    // sticky bar — and the card's call button.
    expect(html.match(/href="tel:\+33612345678"/g)?.length).toBeGreaterThanOrEqual(7);
    expect(html.match(/>\+33 6 12 34 56 78</g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("brings WhatsApp to the card when the panel gives it", async () => {
    answer({ phone: LIVE, whatsapp: LIVE });
    expect(await homeHtml()).toContain('href="https://wa.me/33612345678');
  });

  it("is on the sub-pages too", async () => {
    answer({ phone: LIVE });
    const { view, copy, renderedAt } = await loadPlace(params);
    const html = renderToStaticMarkup(createElement(PlaceSubpage, { view, copy, page: "prices", renderedAt }));
    expect(html).not.toContain(SAMPLE_PHONE.href);
    expect(html).toContain('href="tel:+33612345678"');
  });
});

describe("no phone from the panel", () => {
  it("keeps the frame's sample, and offers no call or WhatsApp in the card", async () => {
    answer({});
    const html = await homeHtml();
    expect(html).toContain(`href="${SAMPLE_PHONE.href}"`);
    expect(html).not.toMatch(/wa\.me|whatsapp/i);
    // Every number dialled is the sample: the card adds none of its own.
    expect(html).not.toMatch(/href="tel:(?!\+12085550192")/);
  });

  it("keeps it when the source is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await homeHtml()).toContain(`href="${SAMPLE_PHONE.href}"`);
  });
});
