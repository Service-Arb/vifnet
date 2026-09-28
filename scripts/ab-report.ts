// The experiments' scoreboard: `npm run ab:report`. Reads the experiment_*
// events of this brand from PostHog (HogQL through the query API), leaves out
// forced (QA) traffic, and per experiment × variant prints exposures, leads,
// calls and form opens, the rates, a Beta-Binomial P(b > a) with its expected
// loss, how long the test has run, and the verdict of the stop rule in
// docs/EXPERIMENTS.md.
//
//   POSTHOG_PERSONAL_API_KEY  a personal key with query:read (never commit it)
//   POSTHOG_PROJECT_ID        default 614067 (EV fronts, US Cloud)
//   POSTHOG_API_HOST          default https://us.posthog.com
//   AB_BRAND                  default vifnet
//   AB_DAYS                   look-back window, default 90
//
// Plain `node` runs it (type stripping), so it imports nothing but builtins.

/** The events `src/shared/config/experiments.ts` names; aquafix sends the same. */
const EVENTS = ["experiment_exposed", "experiment_contact", "experiment_step", "experiment_lead"] as const;
const CALLS = ["phone", "whatsapp"];
const FORM_OPENS = ["form_open", "booking"];

/** The stop rule (docs/EXPERIMENTS.md). */
export const STOP = { minDays: 14, minExposures: 100, ship: 0.95, keep: 0.05, guardrailFloor: 0.2 } as const;

export type Row = { experiment: string; variant: string; event: string; channel: string; n: number; first: string; last: string };

export type Arm = { variant: string; exposures: number; leads: number; calls: number; formOpens: number; steps: number; first: number; last: number };

export function tally(rows: readonly Row[]): Map<string, Map<string, Arm>> {
  const out = new Map<string, Map<string, Arm>>();
  for (const r of rows) {
    const arms = out.get(r.experiment) ?? new Map<string, Arm>();
    out.set(r.experiment, arms);
    const arm = arms.get(r.variant) ?? { variant: r.variant, exposures: 0, leads: 0, calls: 0, formOpens: 0, steps: 0, first: Infinity, last: -Infinity };
    arms.set(r.variant, arm);
    if (r.event === "experiment_exposed") {
      arm.exposures += r.n;
      arm.first = Math.min(arm.first, Date.parse(r.first));
      arm.last = Math.max(arm.last, Date.parse(r.last));
    } else if (r.event === "experiment_lead") arm.leads += r.n;
    else if (r.event === "experiment_step") arm.steps += r.n;
    else if (r.event === "experiment_contact" && CALLS.includes(r.channel)) arm.calls += r.n;
    else if (r.event === "experiment_contact" && FORM_OPENS.includes(r.channel)) arm.formOpens += r.n;
  }
  return out;
}

/** Deterministic in tests: mulberry32. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng: () => number): number {
  const u = 1 - rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Marsaglia–Tsang; `shape < 1` through the boost `G(a) = G(a + 1)·U^(1/a)`. */
export function gamma(shape: number, rng: () => number): number {
  if (shape < 1) return gamma(shape + 1, rng) * Math.pow(1 - rng(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = 1 - rng();
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}

export function beta(a: number, b: number, rng: () => number): number {
  const x = gamma(a, rng);
  return x / (x + gamma(b, rng));
}

export type Comparison = { pBBeatsA: number; lossA: number; lossB: number };

/**
 * Beta(1, 1) priors on each arm's rate, `successes` of `trials`: P(b > a) by
 * Monte Carlo, and the expected loss of shipping each — how much rate we
 * give up, on average, if it is the worse one. Successes above trials (a lead
 * with no exposure: no script, a blocked beacon) are capped.
 */
export function compare(a: { successes: number; trials: number }, b: { successes: number; trials: number }, draws = 100_000, rng: () => number = Math.random): Comparison {
  const post = (x: { successes: number; trials: number }) => {
    const s = Math.min(x.successes, x.trials);
    return [1 + s, 1 + x.trials - s] as const;
  };
  const [aa, ab] = post(a);
  const [ba, bb] = post(b);
  let wins = 0;
  let lossA = 0;
  let lossB = 0;
  for (let i = 0; i < draws; i++) {
    const pa = beta(aa, ab, rng);
    const pb = beta(ba, bb, rng);
    if (pb > pa) wins++;
    lossA += Math.max(pb - pa, 0);
    lossB += Math.max(pa - pb, 0);
  }
  return { pBBeatsA: wins / draws, lossA: lossA / draws, lossB: lossB / draws };
}

export type Verdict = "keep running" | "ship b" | "keep a";

/**
 * The stop rule: at least `minDays` and `minExposures` in every arm, then
 * P(b > a) on the primary metric past `ship` or under `keep`. Shipping b also
 * needs the guardrail (contact rate) not credibly worse.
 */
export function verdict(days: number, a: Arm, b: Arm, primary: number, guardrail: number): Verdict {
  if (days < STOP.minDays || Math.min(a.exposures, b.exposures) < STOP.minExposures) return "keep running";
  if (primary >= STOP.ship && guardrail >= STOP.guardrailFloor) return "ship b";
  if (primary <= STOP.keep) return "keep a";
  return "keep running";
}

export const contacts = (arm: Arm) => arm.leads + arm.calls;

export function hogql(days: number): string {
  // `forced` is a JSON boolean; HogQL reads a property as its string.
  return `SELECT properties.experiment AS experiment, properties.variant AS variant, event,
  coalesce(properties.channel, '') AS channel, count() AS n, min(timestamp) AS first, max(timestamp) AS last
FROM events
WHERE event IN (${EVENTS.map(e => `'${e}'`).join(", ")})
  AND properties.brand_id = {brand}
  AND coalesce(toString(properties.forced), '') != 'true'
  AND timestamp > now() - INTERVAL ${Math.trunc(days)} DAY
GROUP BY experiment, variant, event, channel
ORDER BY experiment, variant, event, channel`;
}

const pct = (x: number) => `${(100 * x).toFixed(2)} %`;
const rate = (n: number, d: number) => (d > 0 ? n / d : 0);

export function report(rows: readonly Row[], now: number, rng: () => number = Math.random): string {
  const lines: string[] = [];
  for (const [experiment, arms] of tally(rows)) {
    const all = [...arms.values()].sort((x, y) => x.variant.localeCompare(y.variant));
    const first = Math.min(...all.map(a => a.first));
    const days = Number.isFinite(first) ? (now - first) / 86_400_000 : 0;
    lines.push(`\n${experiment} — ${days.toFixed(1)} days running`);
    lines.push("variant  exposures  leads  calls  form_opens  steps  lead rate  contact rate");
    for (const a of all) {
      lines.push(
        [a.variant.padEnd(7), String(a.exposures).padStart(9), String(a.leads).padStart(6), String(a.calls).padStart(6), String(a.formOpens).padStart(11), String(a.steps).padStart(6), pct(rate(a.leads, a.exposures)).padStart(10), pct(rate(contacts(a), a.exposures)).padStart(13)].join(" "),
      );
    }
    const a = arms.get("a");
    const b = arms.get("b");
    if (!a || !b) {
      lines.push("verdict: keep running (an arm has no data yet)");
      continue;
    }
    const lead = compare({ successes: a.leads, trials: a.exposures }, { successes: b.leads, trials: b.exposures }, 100_000, rng);
    const contact = compare({ successes: contacts(a), trials: a.exposures }, { successes: contacts(b), trials: b.exposures }, 100_000, rng);
    lines.push(`primary  lead rate:    P(b > a) = ${lead.pBBeatsA.toFixed(3)}  expected loss if a ${pct(lead.lossA)}, if b ${pct(lead.lossB)}`);
    lines.push(`guardrail contact rate: P(b > a) = ${contact.pBBeatsA.toFixed(3)}`);
    lines.push(`verdict: ${verdict(days, a, b, lead.pBBeatsA, contact.pBBeatsA)}`);
  }
  return lines.length ? lines.join("\n") : "no experiment events yet";
}

async function main(): Promise<void> {
  const key = process.env["POSTHOG_PERSONAL_API_KEY"];
  if (!key) {
    console.error("POSTHOG_PERSONAL_API_KEY is not set: a personal API key with query:read (PostHog → Settings → Personal API keys)");
    process.exit(2);
  }
  const project = process.env["POSTHOG_PROJECT_ID"] ?? "614067";
  const host = (process.env["POSTHOG_API_HOST"] ?? "https://us.posthog.com").replace(/\/+$/, "");
  const brand = process.env["AB_BRAND"] ?? "vifnet";
  const days = Number(process.env["AB_DAYS"] ?? 90);
  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql(days), values: { brand } } }),
  });
  if (!res.ok) {
    console.error(`PostHog answered ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const body = (await res.json()) as { results?: unknown[][] };
  const rows: Row[] = (body.results ?? []).map(([experiment, variant, event, channel, n, first, last]) => ({
    experiment: String(experiment),
    variant: String(variant),
    event: String(event),
    channel: String(channel ?? ""),
    n: Number(n),
    first: String(first),
    last: String(last),
  }));
  console.log(`brand ${brand}, last ${days} days, forced traffic excluded`);
  console.log(report(rows, Date.now()));
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
