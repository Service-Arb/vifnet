import { applyOverrides, type ExperimentOverrides } from "@evinvest/experiments";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXPERIMENTS } from "@/shared/config/experiments";

// The panel's answer, as the proxy's `liveExperiments` lays it over the code.
let overrides: ExperimentOverrides = {};
vi.mock("@/shared/config/env", () => ({ liveExperiments: async () => applyOverrides(EXPERIMENTS, overrides) }));

const { proxy } = await import("../proxy");

/** A visitor the proxy has put in an arm of every test: nothing left for it to draw. */
const ASSIGNED = "ab_lead_form=b; ab_booking_provider=a; ab_lead_channel=e";

const BROWSER ="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

/** `fetchSite`: the `Sec-Fetch-Site` a browser sends — where the navigation came from; left out, no such header. */
function get(path: string, cookie = "", fetchSite?: string): NextRequest {
  const headers: Record<string, string> = { host: "localhost", "user-agent": BROWSER, cookie };
  if (fetchSite !== undefined) headers["sec-fetch-site"] = fetchSite;
  return new NextRequest(new URL(path, "http://localhost"), { headers });
}

/** Where the proxy sends the request: the rewrite target's path, or `null` for none. */
async function rewrittenTo(request: NextRequest): Promise<string | null> {
  return rewriteOf(await proxy(request));
}

function rewriteOf(response: Response): string | null {
  const target = response.headers.get("x-middleware-rewrite");
  return target === null ? null : new URL(target).pathname;
}

/** The raw `Set-Cookie` lines a response sends for one cookie name. */
const setCookies = (response: Response, name: string) => response.headers.getSetCookie().filter(c => c.startsWith(`${name}=`));

/** `ASSIGNED`'s own arms, as the QA mark keeps them. */
const ASSIGNED_SNAPSHOT = "lead_form.b~booking_provider.a~lead_channel.e";

/**
 * One browser across visits: each response's `Set-Cookie` lands in its jar
 * (`Max-Age=0` removes), and the next visit sends the jar — what a QA tester's
 * phone does between taps.
 */
function browser(cookie: string) {
  const jar = new Map(
    cookie.split("; ").map(pair => {
      const [name = "", value = ""] = pair.split("=");
      return [name, value] as const;
    }),
  );
  return {
    jar,
    async visit(path: string, fetchSite?: string) {
      const response = await proxy(get(path, [...jar].map(([name, value]) => `${name}=${value}`).join("; "), fetchSite));
      for (const c of response.cookies.getAll()) {
        if (c.maxAge === 0) jar.delete(c.name);
        else jar.set(c.name, c.value);
      }
      return response;
    },
  };
}

describe("the proxy under the panel's overrides", () => {
  beforeEach(() => {
    overrides = {};
  });

  it("rewrites an assigned visitor to a path naming every running test", async () => {
    expect(await rewrittenTo(get("/fr", ASSIGNED))).toBe("/fr/_vifnet~lead_form.b~booking_provider.a~lead_channel.e");
  });

  it("drops a switched-off test from the path even with its cookie: the page renders its control and counts nothing", async () => {
    overrides = { lead_form: { enabled: false } };
    expect(await rewrittenTo(get("/fr", ASSIGNED))).toBe("/fr/_vifnet~booking_provider.a~lead_channel.e");
    overrides = { lead_channel: { enabled: false } };
    expect(await rewrittenTo(get("/fr", ASSIGNED))).toBe("/fr/_vifnet~lead_form.b~booking_provider.a");
  });

  it("assigns no cookie for a switched-off test, and the panel's weights for a running one", async () => {
    overrides = { lead_form: { enabled: false }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 0, 0, 0, 1] } };
    const cookies = (await proxy(get("/fr"))).cookies;
    expect(cookies.get("ab_lead_form")).toBeUndefined();
    expect(cookies.get("ab_booking_provider")?.value).toBe("b");
    expect(cookies.get("ab_lead_channel")?.value).toBe("g");
  });

  it("forces a lead_channel arm by its link, beside the visitor's other arms, and keeps the own arms in the QA mark", async () => {
    const response = await proxy(get("/fr?ab_lead_channel=c", ASSIGNED));
    expect(response.cookies.get("ab_lead_channel")?.value).toBe("c");
    expect(response.cookies.get("ab__qa")?.value).toBe(ASSIGNED_SNAPSHOT);
    expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.a~lead_channel.c");
  });

  describe("a QA visit from outside the site, the URL its whole state", () => {
    it("puts lead_form back on the visitor's own arm when the next force names lead_channel only", async () => {
      const phone = browser(ASSIGNED);
      await phone.visit("/fr?ab_lead_form=c");
      const response = await phone.visit("/fr?ab_lead_channel=b");
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab__qa")?.value).toBe(ASSIGNED_SNAPSHOT);
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.a~lead_channel.b");
    });

    it("ends on an outside entry to the home page with no force: own arms back, the mark and the paused list dropped", async () => {
      overrides = { booking_provider: { enabled: false } };
      const phone = browser(ASSIGNED);
      await phone.visit("/fr?ab_lead_form=c");
      await phone.visit("/fr?ab_lead_channel=b");
      expect(phone.jar.get("ab__qa_off")).toBe("booking_provider");

      const response = await phone.visit("/fr", "none");
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~lead_channel.e");
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(setCookies(response, "ab__qa_off")).toEqual([expect.stringMatching(/^ab__qa_off=;.*Max-Age=0/i)]);
      expect(Object.fromEntries(phone.jar)).toEqual({ ab_lead_form: "b", ab_booking_provider: "a", ab_lead_channel: "e" });
    });

    it("gives the own arms back after Reset dropped every arm, rather than drawing new ones", async () => {
      // The panel's weights would draw c, a and g: the arms that come back are the snapshot's.
      overrides = { lead_form: { weights: [0, 0, 1] }, booking_provider: { weights: [1, 0] }, lead_channel: { weights: [0, 0, 0, 0, 0, 0, 1] } };
      // kitstart's Reset: a same-origin `location.replace` with the mark and the paused list, and no arm.
      const response = await proxy(get("/fr", "ab__qa=lead_form.b~booking_provider.b~lead_channel.e; ab__qa_off=hero", "same-origin"));
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("e");
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.b~lead_channel.e");
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(setCookies(response, "ab__qa_off")).toEqual([expect.stringMatching(/^ab__qa_off=;.*Max-Age=0/i)]);
    });

    it("ends on Reset while a paused test's arm is all the browser sends", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr", `ab__qa=${ASSIGNED_SNAPSHOT}; ab__qa_off=lead_form; ab_lead_form=b`, "same-origin"));
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(setCookies(response, "ab__qa_off")).toEqual([expect.stringMatching(/^ab__qa_off=;.*Max-Age=0/i)]);
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("a");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("e");
      expect(rewriteOf(response)).toBe("/fr/_vifnet~booking_provider.a~lead_channel.e");
    });

    it("takes a newcomer's snapshot from the arms drawn on that first forced visit", async () => {
      overrides = { lead_form: { weights: [0, 1, 0] }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 1, 0, 0, 0] } };
      const response = await proxy(get("/fr?ab_lead_form=c"));
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=lead_form\.b~booking_provider\.b~lead_channel\.d;/)]);
      expect(response.cookies.get("ab_lead_form")?.value).toBe("c");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("d");
    });

    it("keeps the first snapshot on a later force, and sends the mark again for its 30 days", async () => {
      const phone = browser(ASSIGNED);
      await phone.visit("/fr?ab_lead_form=c");
      const response = await phone.visit("/fr?ab_lead_form=a");
      expect(response.cookies.get("ab_lead_form")?.value).toBe("a");
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(new RegExp(`^ab__qa=${ASSIGNED_SNAPSHOT};.*Max-Age=2592000`, "i"))]);
    });

    it("drops the legacy mark `1` on an outside entry with no force, and draws every running test afresh", async () => {
      // `1` holds no own arm, and the cookies may be forced ones: the panel's weights decide (b, b, d).
      overrides = { lead_form: { weights: [0, 1, 0] }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 1, 0, 0, 0] } };
      const response = await proxy(get("/fr", "ab__qa=1; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e"));
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("d");
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.b~lead_channel.d");
    });

    it("leaves a paused test's arm alone when it drops the legacy mark", async () => {
      overrides = { lead_form: { weights: [0, 1, 0] }, booking_provider: { weights: [0, 1] }, lead_channel: { enabled: false } };
      const response = await proxy(get("/fr", "ab__qa=1; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e", "none"));
      expect(setCookies(response, "ab_lead_channel")).toEqual([]);
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
    });

    it("draws afresh only the running tests a partial snapshot lacks", async () => {
      // lead_form's weights would draw c: it comes back from the snapshot instead.
      overrides = { lead_form: { weights: [0, 0, 1] }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 0, 0, 0, 1] } };
      const response = await proxy(get("/fr", "ab__qa=lead_form.b; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e", "none"));
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("g");
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.b~lead_channel.g");
    });

    it("draws every running test afresh when the snapshot holds no arm", async () => {
      overrides = { lead_form: { weights: [0, 1, 0] }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 1, 0, 0, 0] } };
      const response = await proxy(get("/fr", "ab__qa=-; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e", "none"));
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.b~booking_provider.b~lead_channel.d");
    });

    it("draws a legacy browser's running tests afresh on its next force, never saving its maybe-forced cookies as its own", async () => {
      overrides = { lead_form: { weights: [0, 1, 0] }, booking_provider: { weights: [0, 1] }, lead_channel: { weights: [0, 0, 0, 1, 0, 0, 0] } };
      const response = await proxy(get("/fr?ab_lead_channel=b", "ab__qa=1; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e"));
      expect(response.cookies.get("ab__qa")?.value).toBe("lead_form.b~booking_provider.b~lead_channel.d");
      expect(response.cookies.get("ab_lead_form")?.value).toBe("b");
      expect(response.cookies.get("ab_lead_channel")?.value).toBe("b");
    });

    it("neither forces nor ends QA on a sub-page", async () => {
      const response = await proxy(get("/fr/prices?ab_lead_form=c", `ab__qa=${ASSIGNED_SNAPSHOT}; ab_lead_form=a; ab_booking_provider=a; ab_lead_channel=e`));
      expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
    });
  });

  describe("a QA visit moving around the site", () => {
    /** Own arm a for lead_form, so a forced b is told apart from it. */
    const OWN = "ab_lead_form=a; ab_booking_provider=a; ab_lead_channel=e";

    it("keeps the forced arm when a same-origin link leads to the home page in another language, and sends no A/B cookie", async () => {
      const phone = browser(OWN);
      await phone.visit("/fr?ab_lead_form=b");
      const response = await phone.visit("/en", "same-origin");
      expect(rewriteOf(response)).toBe("/en/_vifnet~lead_form.b~booking_provider.a~lead_channel.e");
      expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
      expect(phone.jar.get("ab__qa")).toBe("lead_form.a~booking_provider.a~lead_channel.e");
    });

    it("keeps it from a same-site link too", async () => {
      const phone = browser(OWN);
      await phone.visit("/fr?ab_lead_form=b");
      const response = await phone.visit("/en", "same-site");
      expect(rewriteOf(response)).toBe("/en/_vifnet~lead_form.b~booking_provider.a~lead_channel.e");
      expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
    });

    it.each([["none"], ["cross-site"], [undefined]])("ends on an entry from outside the site (Sec-Fetch-Site %s)", async fetchSite => {
      const phone = browser(OWN);
      await phone.visit("/fr?ab_lead_form=b");
      const response = await phone.visit("/fr", fetchSite);
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.a~booking_provider.a~lead_channel.e");
      expect(setCookies(response, "ab__qa")).toEqual([expect.stringMatching(/^ab__qa=;.*Max-Age=0/i)]);
      expect(response.cookies.get("ab_lead_form")?.value).toBe("a");
    });

    it("names the paused tests to a browser it keeps in QA", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr", `ab__qa=${ASSIGNED_SNAPSHOT}; ${ASSIGNED}`, "same-origin"));
      expect(setCookies(response, "ab__qa_off")).toEqual([expect.stringMatching(/^ab__qa_off=lead_form;/)]);
      expect(setCookies(response, "ab__qa")).toEqual([]);
    });

    it("keeps QA with every test switched off: no arm then is no Reset", async () => {
      overrides = { lead_form: { enabled: false }, booking_provider: { enabled: false }, lead_channel: { enabled: false } };
      const response = await proxy(get("/fr", "ab__qa=-", "same-origin"));
      expect(setCookies(response, "ab__qa")).toEqual([]);
      expect(response.cookies.get("ab__qa_off")?.value).toBe("lead_form,booking_provider,lead_channel");
    });

    it("keeps a legacy mark `1` too on a link from inside the site", async () => {
      const response = await proxy(get("/fr", "ab__qa=1; ab_lead_form=c; ab_booking_provider=a; ab_lead_channel=e", "same-origin"));
      expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
      expect(rewriteOf(response)).toBe("/fr/_vifnet~lead_form.c~booking_provider.a~lead_channel.e");
    });

    /** Forced on lead_form c from outside, then the language link: the menu's next tap lands on `/en`. */
    async function forcedThenEnglish() {
      const phone = browser("ab_lead_form=a; ab_booking_provider=b; ab_lead_channel=e");
      await phone.visit("/fr?ab_lead_form=c", "none");
      await phone.visit("/en", "same-origin");
      return phone;
    }

    it.each([["same-origin"], ["same-site"]])("keeps the earlier forces a %s force does not name", async fetchSite => {
      const phone = await forcedThenEnglish();
      const response = await phone.visit("/en?ab_lead_channel=f", fetchSite);
      expect(rewriteOf(response)).toBe("/en/_vifnet~lead_form.c~booking_provider.b~lead_channel.f");
      expect(response.cookies.get("ab__qa")?.value).toBe("lead_form.a~booking_provider.b~lead_channel.e");
    });

    it.each([["none"], ["cross-site"], [undefined]])("puts the tests a force from outside (Sec-Fetch-Site %s) does not name back on the own arms", async fetchSite => {
      const phone = await forcedThenEnglish();
      const response = await phone.visit("/en?ab_lead_channel=f", fetchSite);
      expect(rewriteOf(response)).toBe("/en/_vifnet~lead_form.a~booking_provider.b~lead_channel.f");
      expect(response.cookies.get("ab__qa")?.value).toBe("lead_form.a~booking_provider.b~lead_channel.e");
    });
  });

  describe("the paused list a forced visit gets", () => {
    const pausedCookie = (response: Response) => setCookies(response, "ab__qa_off");
    const QA = `ab__qa=${ASSIGNED_SNAPSHOT}; ${ASSIGNED}`;

    it("names a paused test, as a session cookie, and keeps the test's arm", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr?ab_booking_provider=b", QA));
      const [sent, ...more] = pausedCookie(response);
      expect(more).toEqual([]);
      expect(sent).toMatch(/^ab__qa_off=lead_form;/);
      expect(sent).toMatch(/Path=\//i);
      expect(sent).toMatch(/SameSite=Lax/i);
      expect(sent).not.toMatch(/Max-Age|Expires/i);
      expect(setCookies(response, "ab_lead_form")).toEqual([]);
    });

    it("names it on the forced visit that makes the browser QA, beside the QA mark", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr?ab_booking_provider=b", ASSIGNED));
      expect(pausedCookie(response)).toEqual([expect.stringMatching(/^ab__qa_off=lead_form;/)]);
      expect(response.cookies.get("ab__qa")?.value).toBe(ASSIGNED_SNAPSHOT);
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
    });

    it("drops the list once nothing is paused", async () => {
      const [sent, ...more] = pausedCookie(await proxy(get("/fr?ab_booking_provider=b", `ab__qa_off=lead_form; ${QA}`)));
      expect(more).toEqual([]);
      expect(sent).toMatch(/^ab__qa_off=;/);
      expect(sent).toMatch(/Max-Age=0/i);
    });

    it("sends nothing when nothing is paused and the browser has no list", async () => {
      expect(pausedCookie(await proxy(get("/fr?ab_booking_provider=b", QA)))).toEqual([]);
    });

    it("gives a visitor who is not QA no new cookie at all, paused test or not", async () => {
      overrides = { lead_form: { enabled: false } };
      expect((await proxy(get("/fr", ASSIGNED))).headers.getSetCookie()).toEqual([]);
    });

    it("gives a bot nothing, QA cookie and force or not", async () => {
      overrides = { lead_form: { enabled: false } };
      const bot = new NextRequest(new URL("/fr?ab_booking_provider=b", "http://localhost"), { headers: { host: "localhost", "user-agent": "Googlebot/2.1", cookie: QA } });
      expect((await proxy(bot)).headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
    });
  });

  it("takes no forced variant of a switched-off test, so the browser is not marked QA for it", async () => {
    overrides = { lead_form: { enabled: false } };
    const response = await proxy(get("/fr?ab_lead_form=b", "ab_booking_provider=a; ab_lead_channel=a"));
    expect(response.cookies.get("ab__qa")).toBeUndefined();
    expect(new URL(response.headers.get("x-middleware-rewrite") ?? "http://x/").pathname).toBe("/fr/_vifnet~booking_provider.a~lead_channel.a");
  });

  it("serves a bucket path as it is, and strips a test switched off since it was written", async () => {
    expect(await rewrittenTo(get("/fr/_vifnet~lead_form.b~booking_provider.a"))).toBeNull();
    overrides = { lead_form: { enabled: false } };
    expect(await rewrittenTo(get("/fr/_vifnet~lead_form.b~booking_provider.a"))).toBe("/fr/_vifnet~booking_provider.a");
  });

  it("ignores a malformed override: the config in code", async () => {
    overrides = { lead_form: { enabled: "no" as unknown as boolean, weights: [1] } };
    expect(await rewrittenTo(get("/fr", ASSIGNED))).toBe("/fr/_vifnet~lead_form.b~booking_provider.a~lead_channel.e");
  });
});
