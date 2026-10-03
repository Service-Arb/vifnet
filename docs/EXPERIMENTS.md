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
  bucket's own path, `/fr/_vifnet~lead_layout.b`; the page reads its
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
  | `experiment_step` | experiment, variant, step, forced | nothing since `quote_single_step` ended (its two-step card sent it); the report keeps the column for that history |
  | `experiment_lead` | experiment, variant, forced | server side, in `/quote`, after kitstart accepted the lead |

  Every event also carries `brand_id`; the client ones carry `location_id`.
  Client events are sent only by a browser that has an `ab_<key>` cookie, so
  a crawler rendering the cached control page is never an exposure.
  `experiment_lead` is sent only when kitstart stored the lead and did not
  suspect it (a validation failure, the honeypot or the rate limit send
  nothing), for the no-JS POST and the scripted one alike.
- **kitstart's form funnel.** The quote card is kitstart's `LeadCapture`,
  given the assignment (`experiment`, `variant`), so its own events carry it
  on kitstart's schema — the same on every brand, which is what lets an
  experiment's results pool across sites (the site is the stratum):
  `lead_form_view`, `lead_form_start`, `lead_form_field_error {field}`,
  `lead_form_step {step}` (`qualify-first` only), with `form_id` and
  `layout`; `contact_intent_click {channel}`; and, server side,
  `lead_form_submit` with the posted assignment. They go through kitstart's
  sink, not ours: they are not gated on the cookie and carry no `forced`, so
  they are the funnel's diagnostics, not the report's primary metric.
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

`/fr?ab_lead_layout=b` renders b and stores it in the cookie. A forced
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
3. If the thing under test is gone — the form replaced, say — delete the
   experiment outright: with no variant code left there is nothing for
   `enabled: false` to switch. Its old `ab_<key>` cookies are then ignored
   and its bucket paths are no longer written. Move its row to "Ended
   experiments" with what it tested and why it stopped.

## Running experiments

### `lead_layout`

The same key, arms and weights as aquafix's, so the two sites' results pool
(site as the stratum): both run kitstart's `LeadCapture`, and only its
`layout` differs between the arms.

- **Hypothesis**: asking the service first, as one tap on a tile, and only
  then the postcode and the phone (`qualify-first`) raises the share of
  visitors who send a lead, against everything on one screen (`single`). A
  first question that costs nothing commits the visitor; a wall of fields
  turns some away.
- **Evidence**: mixed, which is why it is a test and not a default:
  qualification-first multi-step forms beat single screens in some published
  form studies and lose in others (Zuko), while fewer visible fields reliably
  help (LEAD-CAPTURE-SPEC.md, Service-Arb). No site data of ours.
- **Control (a)**: `single` — service (the kit's select), postcode, phone,
  then the optional name and bedrooms, and the submit, in the frame's card.
- **Variant (b)**: `qualify-first` — a tile per service; the tap shows the
  contact step and focuses its first empty field. A service card's link
  (`data-need`) or `?need=` answers the first step for the visitor, in both
  arms.
- **Both arms**: the name is optional (the lead schema no longer requires
  it), bedrooms is an optional select after the phone, and "Rappelez-moi"
  (kitstart's callback: the phone and a consent) sits under the form as one
  text line. The fields show the frame's placeholders and a taken lead says
  done in the card (kitstart 0.7.0, from 2026-10-03, in both arms alike).
- **Primary metric**: lead rate, `experiment_lead / experiment_exposed`.
- **Guardrail**: contact rate, (leads + calls) / exposures.
- **Diagnostic**: kitstart's `lead_form_start`, `lead_form_step` and
  `lead_form_field_error` per variant, pooled across brands in PostHog.

### `booking_provider` — inert until the panel sets a Google schedule

kitstart's experiment key (`BOOKING_EXPERIMENT`), the same on every brand so
the arms pool; aquafix is to run it with the same arms.

- **Inert today.** The arm only picks among the booking pages the place has,
  and the panel has not given Vifnet's place a Google appointment schedule
  (`PlaceLive.booking.providers.google_calendar.url`, set in the panel's place
  settings). Without one, kitstart's `bookingOf` falls back to the place's
  default, `manual`, so both arms are offered the call and the test is an
  A/A. It needs no deploy to come alive: once the panel serves the URL, b
  gets the schedule on the next render of the page (ISR, 10 minutes).
  `tests/experiments.test.ts` holds both cases.
- **Hypothesis**: after a priced lead, letting the visitor pick a slot on the
  owner's Google schedule books more slots than the promise of a call
  (where customers book more easily — FORM-VARIANTS-SPEC.md, "Booking
  providers contract").
- **Control (a)**: `manual` — the card says "Nous vous rappelons pour fixer le
  créneau" and offers an optional preference (a day, a part of the day),
  sent as `booking.requested@1` once the panel accepts it (`PANEL_BOOKING`).
- **Variant (b)**: `google_calendar` — "Choisir un créneau" opens the
  schedule in a new tab, nothing loaded before the click. Google takes no
  parameter, so the card asks the visitor to enter the same phone number
  there (kitstart's `bookPhoneHint`); the panel matches the booking to the
  lead by contact and time. The schedule's booking form must ask for the
  phone ("Téléphone", required).
- **Both arms**: only a priced lead (the regular clean, an estimate) books;
  a quote's slot is set on the call. The page view counts an exposure and
  the taps a contact under `booking_provider`, as for `lead_layout`, so
  `npm run ab:report` lists it; its lead rate is a guardrail here (the arm
  shows only after the lead), not the result.
- **Primary metric**: slots booked per lead, by arm. A Google schedule
  opens in a new tab and never tells the page a slot was taken, so the
  booked count is the panel's: its booked slots per lead (b's from Google
  through its Calendar sync, a's set by the operator after the call). On
  the page, kitstart's `lead_booking_open {provider}` over `experiment_lead`
  of `booking_provider` per variant is the diagnostic: how many reach for a
  slot. The denominator counts quotes too, which never book; randomised,
  their share is the same in both arms. `provider` is what was offered, so
  while the arm is inert both read `manual`.

## Ended experiments

### `quote_single_step` — ended unresolved (code 2026-10-03; live with the next release)

- **What it tested**: the Figma frame's two-step quote card (name, phone,
  postcode, then "Continue", bedrooms and service; a) against the same card
  as one step (name, phone, postcode, service; no bedrooms; b,
  `form_id = quote_single_step`). Hypothesis: one step raises the lead rate.
- **Why it ended**: the form it tested was replaced by kitstart's
  `LeadCapture`, the lead form every Service-Arb brand now shares, so neither
  arm exists any more. It was removed outright (step 3 above) before reaching
  the stop rule — no verdict. Its events stay in PostHog under
  `experiment = quote_single_step`; `npm run ab:report` still prints them
  while they are inside `AB_DAYS`.
- **Successor**: `lead_layout`, which asks the same question — how much of
  the form a visitor faces at once — on the shared component.
