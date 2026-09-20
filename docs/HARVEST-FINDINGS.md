# Harvest findings: what the sources can and cannot give you

Measured 2026-09-20. These numbers decide how the pipeline should be used, so they are written
down rather than rediscovered.

## What the current pool contains

`pool/leads.json`, last updated 2026-09-18, harvested for **Stratford, London / salon**:

| Measure | Value |
| --- | --- |
| Leads in pool | 32 |
| Category | salon 32 (100%) |
| Tier | B 26, C 6 |
| Status | new 31, demo 1 |
| With a phone number | **1** |
| With an email | **1** |
| With either | **1** |
| With opening hours | 2 |
| Marked as a chain | 2 |
| Contacted | **0** |

Highest score in the pool is 55. Every lead's `why` reads the same:

```
no site +25 | full address +10 | independent +8 | category +5 | real name +5 | geo +2
```

Note what is **absent**: the `phone +30` term never fires. That is the single reason nothing
reaches tier A.

## The code is not at fault

`tools/harvest.mjs` reads phone tags correctly:

```js
phone: first(tags, ['phone', 'contact:phone', 'contact:mobile', 'mobile']),
```

It queries Overpass with `out center tags`, and the raw files confirm tags are returned, with
3 to 15 tag keys per lead. Addresses and postal codes are populated, so tag parsing works.

The data itself is thin. A direct Overpass count over the same bounding box
(`51.52,-0.03,51.56,0.02`) returns:

| Query | Result |
| --- | --- |
| All `shop=hairdresser` nodes | **58** |
| Those with a `phone` tag | **4** |
| Phone coverage | **6.9%** |
| All `craft=plumber` nodes | **1** |

So roughly one urban salon in fourteen is contactable by phone from OpenStreetMap alone, and
mobile trades are almost entirely unmapped.

This is a source property, not a bug. The README predicted the second half of it: a business
with no website and no social page has nothing for `enrich` to read, so the gap cannot be
closed downstream.

## What this means for the method

**The pool is a walk-in route, not a call list.** Thirty-two salons with street addresses,
postal codes, and coordinates clustered around The Mall and Broadway in Stratford is a
physical round you can walk in an afternoon. That is channel 2 in `OUTREACH.md`, and for this
data it is the *only* channel available. Treat it that way:

- Group leads by street and walk them, phone or tablet in hand, demo already built.
- Do not build 32 demos. Pick the best 3 to 5 on one street, build those, and walk.
- `enrich` still runs first, because when a lead does have a social page it is the cheapest
  contact detail available.

**Choose the trade to match the source.** Volume and contactability trade against each other:

| Trade type | OSM volume | OSM phone coverage | Verdict |
| --- | --- | --- | --- |
| Salons, barbers, beauty | High (58 nodes in one small bbox) | Very low (7%) | Walk-in route |
| Mobile trades (plumber, electrician, handyman) | Near zero (1 node) | n/a | Do not harvest; find by hand |
| Professional services (dentist, accountant, lawyer) | Moderate | Moderate | Test before trusting |

**Tier A is currently unreachable.** The thresholds are A (70+), B (45-69), C (below 45), but
the maximum achievable score without a phone number is around 55. For shop categories in
OpenStreetMap, expect everything to land in tier B. Ranking still works, because it orders
within B by address and geodata, but a tier-A badge will not appear. Either accept that or
recalibrate the thresholds against real data.

## Open questions worth measuring before changing code

1. Does phone coverage improve in suburban or rural areas, where mappers are more likely to
   record a contactable business rather than a shopfront?
2. Do `contact:phone` tags add meaningfully to `phone` coverage? The counts above tested only
   the `phone` key.
3. Would a Google Places or Facebook page lookup be worth it for the contact gap? Both cost
   either money or terms-of-service risk, so measure the yield on a small sample first.

## Method note

Probing used the public Overpass endpoint identified in `tools/harvest.mjs`. Repeated queries
started returning 504s, which is the service asking to be left alone. Harvest in bulk through
`tools/harvest.mjs`, which paces itself with a delay between requests, rather than by hand.
