# Experiments

A/B tests on the home page, measured in PostHog (Cloud US, project 614067,
filtered by `brand_id = vifnet`). aquafix runs the same machinery with the same
event names and the same `npm run ab:report`, so the two reports read alike.

## How it works

- **Config**: `src/shared/config/experiments.ts` — each experiment's variants
  (`variants[0]` is the control), weights (50/50) and `enabled`.
- **Assignment**: `proxy.ts` runs kitstart's routing, then, on a place's home
  page only, `abProxy` from `@evinvest/experiments/next`: a weighted random
  variant in a sticky `ab_<key>` cookie (30 days, `SameSite=Lax`). Crawlers
  and link previews (`isBot` in `src/shared/lib/experiments.ts`: Googlebot,
  bingbot, AdsBot, anything saying bot/crawler/spider/preview, and no user
  agent at all) get the control and no cookie.
- **Rendering stays ISR.** A visitor off the control is rewritten to the
  bucket's own path, `/fr/_vifnet~quote_single_step.b`; the page reads its
  variant from the `[location]` param, never from the request, so each bucket
  is its own cache entry and the control's entry is the page as it always
  was. There is no per-request rendering cost.
- **Events** go through a site-local cookieless beacon sink
  (`features/experiment`), with kitstart's key and host, server-rendered into
  props:

  | event | props | sent |
  | --- | --- | --- |
  | `experiment_exposed` | experiment, variant, forced | once per page view |
  | `experiment_contact` | experiment, variant, channel, forced | a `tel:`/WhatsApp tap, or a `data-intent` of `form_open`/`booking` |
  | `experiment_step` | experiment, variant, step, forced | the two-step card reaching step 2 (control only) |
  | `experiment_lead` | experiment, variant, forced | server side, in `/quote`, after kitstart accepted the lead |

  Every event also carries `brand_id`; the client ones carry `location_id`.
  Client events are sent only by a browser that has an `ab_<key>` cookie, so
  a crawler rendering the cached control page is never an exposure.
  `experiment_lead` is sent only when kitstart stored the lead and did not
  suspect it (a validation failure, the honeypot or the rate limit send
  nothing), for both the no-JS POST and the card's `fetch`.
- **No person is joined.** The sink is cookieless and its `distinct_id` is
  random per page, so exposure and lead are compared as aggregates per
  variant, not per visitor.

## Reading the result

```sh
POSTHOG_PERSONAL_API_KEY=phx_… npm run ab:report
```

A personal API key with `query:read`. Optional: `POSTHOG_PROJECT_ID`
(614067), `POSTHOG_API_HOST` (`https://us.posthog.com`), `AB_BRAND` (vifnet),
`AB_DAYS` (90). Forced traffic is left out. Per experiment × variant it prints
exposures, leads, calls, form opens, steps, the lead rate (leads / exposures)
and the contact rate ((leads + calls) / exposures), then P(b > a) from
Beta(1, 1)-Binomial posteriors by Monte Carlo, the expected loss of shipping
each arm, the days running and a verdict.

## Stop rule

Decide only when **all** hold:

1. at least **14 days** running (two full weekly cycles), **and**
2. at least **~100 exposures in each arm**, **and**
3. P(b > a) on the primary metric **≥ 0.95** (ship b) or **≤ 0.05** (keep a).

Shipping b also needs the guardrail not credibly worse: P(b > a) on the
contact rate ≥ 0.2. Otherwise the verdict is "keep running". Do not peek and
stop early on a lucky day — the thresholds assume the minimums above.

## Forcing a variant (QA)

`/fr?ab_quote_single_step=b` renders b and stores it in the cookie. A forced
visit also sets `ab__qa=1` for 30 days: every event from that browser says
`forced: true` and the report leaves it out. Clear the site's cookies to be a
normal visitor again.

## Ending an experiment

1. Set `enabled: false` in `src/shared/config/experiments.ts` and deploy:
   everyone gets the control on the next render, cookies are ignored and no
   event is sent.
2. If b won, make b the page (the Figma frame follows, or the owner signs the
   departure off), then delete the experiment, its variant code and its row
   here.

## Running experiments

### `quote_single_step`

- **Hypothesis**: collapsing the quote card into one step raises the share of
  visitors who send a lead. Every extra field and every extra step costs
  leads on a phone, and our visitors arrive from Google Maps on a phone with
  intent.
- **Evidence**: general form-usability findings (completion falls as fields
  are added, and a hidden submit behind a "Continue" loses some who never
  press it), and this form's own shape: the second step asks nothing the
  callback cannot (bedrooms). No site data yet — analytics was off in prod
  until this change; `experiment_step` shows how many start the form.
- **Control (a)**: the Figma frame's two steps — name, phone, postcode, then
  bedrooms and service. Untouched.
- **Variant (b)**: one step — name (the lead schema requires it), phone,
  postcode, service, submit. Bedrooms is dropped (optional in the schema).
  Same words, fields and look; `form_id = quote_single_step`, so kitstart's
  `lead_form_submit` splits too.
- **Primary metric**: lead rate, `experiment_lead / experiment_exposed`.
- **Guardrail**: contact rate, (leads + calls) / exposures.
- **Diagnostic**: `experiment_step` (control only) — how many start the form.
