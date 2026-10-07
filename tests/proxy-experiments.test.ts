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

function get(path: string, cookie = ""): NextRequest {
  return new NextRequest(new URL(path, "http://localhost"), { headers: { host: "localhost", "user-agent": BROWSER, cookie } });
}

/** Where the proxy sends the request: the rewrite target's path, or `null` for none. */
async function rewrittenTo(request: NextRequest): Promise<string | null> {
  const target = (await proxy(request)).headers.get("x-middleware-rewrite");
  return target === null ? null : new URL(target).pathname;
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

  it("forces a lead_channel arm by its link, beside the visitor's other arms", async () => {
    const response = await proxy(get("/fr?ab_lead_channel=c", "ab_lead_form=b; ab_booking_provider=a"));
    expect(response.cookies.get("ab_lead_channel")?.value).toBe("c");
    expect(response.cookies.get("ab__qa")?.value).toBe("1");
    expect(new URL(response.headers.get("x-middleware-rewrite") ?? "http://x/").pathname).toBe("/fr/_vifnet~lead_form.b~booking_provider.a~lead_channel.c");
  });

  describe("the paused list a QA browser gets", () => {
    const pausedCookie = (response: Response) => response.headers.getSetCookie().filter(c => c.startsWith("ab__qa_off="));

    it("names a paused test, as a session cookie, and keeps the test's arm", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr", "ab__qa=1; ab_lead_form=b; ab_booking_provider=a"));
      const [sent, ...more] = pausedCookie(response);
      expect(more).toEqual([]);
      expect(sent).toMatch(/^ab__qa_off=lead_form;/);
      expect(sent).toMatch(/Path=\//i);
      expect(sent).toMatch(/SameSite=Lax/i);
      expect(sent).not.toMatch(/Max-Age|Expires/i);
      expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_lead_form="))).toEqual([]);
    });

    it("names it on the forced visit that makes the browser QA, beside the QA mark", async () => {
      overrides = { lead_form: { enabled: false } };
      const response = await proxy(get("/fr?ab_booking_provider=b", "ab_lead_form=b"));
      expect(pausedCookie(response)).toEqual([expect.stringMatching(/^ab__qa_off=lead_form;/)]);
      expect(response.cookies.get("ab__qa")?.value).toBe("1");
      expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
    });

    it("drops the list once nothing is paused", async () => {
      const [sent, ...more] = pausedCookie(await proxy(get("/fr", "ab__qa=1; ab__qa_off=lead_form; ab_lead_form=b; ab_booking_provider=a")));
      expect(more).toEqual([]);
      expect(sent).toMatch(/^ab__qa_off=;/);
      expect(sent).toMatch(/Max-Age=0/i);
    });

    it("sends nothing when nothing is paused and the browser has no list", async () => {
      expect(pausedCookie(await proxy(get("/fr", "ab__qa=1; ab_lead_form=b; ab_booking_provider=a")))).toEqual([]);
    });

    it("gives a visitor who is not QA no new cookie at all, paused test or not", async () => {
      overrides = { lead_form: { enabled: false } };
      expect((await proxy(get("/fr", ASSIGNED))).headers.getSetCookie()).toEqual([]);
    });

    it("gives a bot nothing, QA cookie or not", async () => {
      overrides = { lead_form: { enabled: false } };
      const bot = new NextRequest(new URL("/fr", "http://localhost"), { headers: { host: "localhost", "user-agent": "Googlebot/2.1", cookie: "ab__qa=1; ab_lead_form=b" } });
      expect(pausedCookie(await proxy(bot))).toEqual([]);
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
