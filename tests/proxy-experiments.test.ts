import { applyOverrides, type ExperimentOverrides } from "@evinvest/experiments";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXPERIMENTS } from "@/shared/config/experiments";

// The panel's answer, as the proxy's `liveExperiments` lays it over the code.
let overrides: ExperimentOverrides = {};
vi.mock("@/shared/config/env", () => ({ liveExperiments: async () => applyOverrides(EXPERIMENTS, overrides) }));

const { proxy } = await import("../proxy");

const BROWSER = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

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
    expect(await rewrittenTo(get("/fr", "ab_lead_form=b; ab_booking_provider=a"))).toBe("/fr/_vifnet~lead_form.b~booking_provider.a");
  });

  it("drops a switched-off test from the path even with its cookie: the page renders its control and counts nothing", async () => {
    overrides = { lead_form: { enabled: false } };
    expect(await rewrittenTo(get("/fr", "ab_lead_form=b; ab_booking_provider=a"))).toBe("/fr/_vifnet~booking_provider.a");
  });

  it("assigns no cookie for a switched-off test, and the panel's weights for a running one", async () => {
    overrides = { lead_form: { enabled: false }, booking_provider: { weights: [0, 1] } };
    const cookies = (await proxy(get("/fr"))).cookies;
    expect(cookies.get("ab_lead_form")).toBeUndefined();
    expect(cookies.get("ab_booking_provider")?.value).toBe("b");
  });

  it("drops a switched-off test's cookie, keeps a running one's, and keeps the other Set-Cookies", async () => {
    overrides = { lead_form: { enabled: false } };
    const response = await proxy(get("/fr?ab_booking_provider=b", "ab_lead_form=b; ab_booking_provider=a"));
    const sent = response.headers.getSetCookie();
    const dropped = sent.find(c => c.startsWith("ab_lead_form="));
    expect(dropped).toMatch(/^ab_lead_form=;/);
    expect(dropped).toMatch(/Max-Age=0/i);
    expect(dropped).toMatch(/Path=\//i);
    expect(dropped).toMatch(/SameSite=Lax/i);
    expect(response.cookies.get("ab_booking_provider")?.value).toBe("b");
    expect(response.cookies.get("ab__qa")?.value).toBe("1");
  });

  it("leaves a running test's cookie alone, and sends nothing for a switched-off test the browser never had", async () => {
    const running = await proxy(get("/fr", "ab_lead_form=b; ab_booking_provider=a"));
    expect(running.headers.getSetCookie().filter(c => c.startsWith("ab_lead_form="))).toEqual([]);
    overrides = { lead_form: { enabled: false } };
    const never = await proxy(get("/fr", "ab_booking_provider=a"));
    expect(never.headers.getSetCookie().filter(c => c.startsWith("ab_lead_form="))).toEqual([]);
  });

  it("drops no cookie for a bot, which gets none either", async () => {
    overrides = { lead_form: { enabled: false } };
    const response = await proxy(new NextRequest(new URL("/fr", "http://localhost"), { headers: { host: "localhost", "user-agent": "Googlebot/2.1", cookie: "ab_lead_form=b" } }));
    expect(response.headers.getSetCookie().filter(c => c.startsWith("ab_"))).toEqual([]);
  });

  it("takes no forced variant of a switched-off test, so the browser is not marked QA for it", async () => {
    overrides = { lead_form: { enabled: false } };
    const response = await proxy(get("/fr?ab_lead_form=b", "ab_booking_provider=a"));
    expect(response.cookies.get("ab__qa")).toBeUndefined();
    expect(new URL(response.headers.get("x-middleware-rewrite") ?? "http://x/").pathname).toBe("/fr/_vifnet~booking_provider.a");
  });

  it("serves a bucket path as it is, and strips a test switched off since it was written", async () => {
    expect(await rewrittenTo(get("/fr/_vifnet~lead_form.b~booking_provider.a"))).toBeNull();
    overrides = { lead_form: { enabled: false } };
    expect(await rewrittenTo(get("/fr/_vifnet~lead_form.b~booking_provider.a"))).toBe("/fr/_vifnet~booking_provider.a");
  });

  it("ignores a malformed override: the config in code", async () => {
    overrides = { lead_form: { enabled: "no" as unknown as boolean, weights: [1] } };
    expect(await rewrittenTo(get("/fr", "ab_lead_form=b; ab_booking_provider=a"))).toBe("/fr/_vifnet~lead_form.b~booking_provider.a");
  });
});
