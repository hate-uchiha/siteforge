# SiteForge

A static site factory for local businesses that either have no website or have a bad one.

One JSON file per client, one command to build, one folder to upload. No frameworks, no npm
dependencies, no build server, no monthly cost beyond an optional domain.

```bash
npm run list          # show available niches and configured clients
npm run build         # build every client in clients/
node build.mjs kings-barbershop    # build one client
npm run serve         # preview everything at http://localhost:4173
node test.mjs         # sanity checks on the generated output
```

Finding prospects runs as a four-step pipeline, each step writing a file you can inspect:

```bash
npm run harvest -- --area "Stratford, London" --categories salon,barber
npm run pool -- --top 20            # merge, score, and rank every lead harvested so far
npm run enrich -- --limit 50        # find emails and phone numbers on the pages leads have
npm run promote -- --list           # pick one, then promote it by slug or name
npm run promote -- peaky-barbers    # writes clients/peaky-barbers.json in demo mode
```

## Why this exists

Prospecting is not the hard part. The hard part is walking into a shop, cold, with nothing in
your hand. SiteForge makes the demo cheap enough to build **before** you make contact, which
changes the whole conversation. You are not selling an idea. You are showing them their own
business, already online, and asking whether they want to keep it.

## How a job runs

1. Fill the pipeline: `npm run harvest` for the town and trade, `npm run pool` to merge and
   score, `npm run enrich` to find the contact details, then `npm run promote -- --list` and pick
   the best lead. See [docs/PROSPECTING.md](docs/PROSPECTING.md) for where to look by hand.
2. `npm run promote -- <slug>` to write `clients/<slug>.json` from that lead's real name,
   address, coordinates, opening hours, phone, and email. Adjust the details it could not find.
3. `node build.mjs <slug>` then `npm run serve` and look at it on a phone.
4. Send them the link. See [docs/OUTREACH.md](docs/OUTREACH.md) for the script.
5. On payment, set `demo: false`, add their domain, and deploy the folder. The generated
   `HANDOFF.md` in each site lists exactly what still needs replacing.

## Structure

```
presets/index.mjs   18 trade presets: colours, headlines, services, FAQ, stats
clients/*.json      one file per business, overrides the preset
assets/base.css     the design system, themed per client
assets/app.js       nav, sticky call bar, scroll reveal, form handling
build.mjs           the generator
sites/<slug>/       built output, ready to upload
docs/               prospecting, outreach, and pricing playbooks
tools/              lead pipeline: harvest, pool, enrich, promote, and trade-to-OSM-tag maps
leads/raw/*.json    raw harvests, one file per area, kept so pool can re-merge them
leads/enriched/     emails and phone numbers found by enrich, merged by pool
pool/leads.json     merged and scored leads, plus leads.csv for a spreadsheet
```

## The lead pipeline

Harvest, pool, enrich, and promote are separate on purpose. Harvesting and enriching touch the
network and are the slow parts; pooling and promoting are instant and rerunnable.

- **`tools/harvest.mjs`** queries the Overpass API for one area, keeps only businesses with no
  website of their own, and writes `leads/raw/<area>-<categories>.json`. Geocoding is cached in
  `leads/.geocache.json` so repeat runs are cheap. A lead without a phone number or an email is
  still recorded, because the address and opening hours are what make a demo credible.
- **`tools/pool.mjs`** merges every raw harvest, every CSV dropped in `leads/import/`, and every
  enrichment result into `pool/leads.json`, deduplicated by phone number or by name and town,
  scored out of 100, and tiered A/B/C. Workflow state (status, notes, contacted dates) already
  in the pool survives re-merges, so you can add fresh harvests without losing your pipeline.
- **`tools/enrich.mjs`** fetches the website or social page a lead already has and pulls the
  email addresses and phone numbers off it. See [Contact details](#contact-details) below.
- **`tools/promote.mjs`** turns one pooled lead into a client file, mapping its OSM trade to a
  preset and parsing `opening_hours` syntax into the day-by-day format the build expects.

Scoring rewards what makes a lead callable and buildable: a phone number (+30), no website
(+25), opening hours (+8), an independent business (+8), and a full address (+10). Chains and
businesses that already have a proper site are pushed down. Tiers are A (70+), B (45-69), and
C (below 45). `--summary` and `--top N` print without rewriting anything.

`--include-with-website` exists for research only. The default is to skip businesses that
already have a site, because they are not the customer this factory is built for.

## Contact details

A lead is only worth what you can do with it. OpenStreetMap carries a phone number for some
businesses and an email for far fewer, so `tools/enrich.mjs` closes the gap by reading the
pages a lead already has:

```bash
npm run enrich -- --dry-run        # list the pages it would fetch, fetch nothing
npm run enrich -- --limit 50       # fetch at most 50 pages this run
npm run pool                       # merge what it found
```

What it does: fetches each lead's website, or its Facebook or Instagram link when that is all
it has, and extracts `mailto:` addresses and `tel:` numbers. Emails are ranked so a business's
own domain beats a third-party one, and the best candidate becomes `email`. Every candidate is
kept in `emails`, and `emailSource` and `phoneSource` record the exact page each value came
from, so a wrong detail is traceable rather than mysterious.

Rules that keep the data trustworthy:

- **Nothing already known is overwritten.** An email from OpenStreetMap or typed in by hand
  always wins; enrichment only fills gaps. Use `--refresh` to re-check pages that already have
  an email, which re-reads the page but still will not overwrite a value that is set.
- **Phone numbers only come from `tel:` links.** Free-text number hunting matches opening
  hours, VAT numbers, and prices far too often to be worth the false positives.
- **robots.txt is respected per host**, requests to the same host are serialised with a delay
  between them, and every result is cached in `leads/.enrichcache.json`. A page that failed is
  retried after a fortnight rather than on every run.

What it cannot do, and where email stays weaker than the phone: a business with no site and no
social page has nothing to read, and Facebook and Instagram block automated fetches, so a
Facebook-only lead usually still needs a human. In practice expect a phone number for a good
share of leads and an email for a minority, which is why email is the second channel in
[docs/OUTREACH.md](docs/OUTREACH.md) and not the first.

## What each build produces

`index.html`, `styles.css`, `app.js`, `favicon.svg` (generated from their initials and brand
colour), `robots.txt`, `sitemap.xml`, `404.html`, `_headers` for Cloudflare Pages or Netlify,
and a `HANDOFF.md` with the launch checklist.

Included in the page: hero with a quote form, trust strip, services, why-us with stats,
gallery, reviews, areas covered, FAQ, call to action band, contact block with opening hours,
map embed, click-to-call, WhatsApp, and a mobile call bar that appears once you scroll past
the fold.

## Built in from the start

- **LocalBusiness JSON-LD** with address, geo, opening hours, and areas served
- **FAQPage JSON-LD** generated from the FAQ section
- **indexable only when you say so.** Demo builds are `noindex, nofollow` and carry a visible
  preview banner. Nothing goes live or gets indexed by accident.
- **No invented review data.** `aggregateRating` schema is only emitted on a live build, because
  Google treats fabricated review markup as spam.
- Mobile first, keyboard accessible, respects `prefers-reduced-motion`, one `h1` per page.
- System font fallback, so the page still looks right if Google Fonts is blocked.

## Deploy (free)

1. Cloudflare Pages or Netlify, free tier, no card needed.
2. Drag the `sites/<slug>` folder into the dashboard.
3. Point the client's domain at it, SSL is automatic.
4. To update content: edit the client JSON, `node build.mjs <slug>`, drag the folder again.

## Adding a niche

Add an entry to `presets/index.mjs` with a `label`, `schemaType`, `brand` colours, `hero`,
`services`, `galleryLabels`, and `faq`. The `schemaType` must be a real
[schema.org LocalBusiness type](https://schema.org/LocalBusiness) so the structured data is valid.

## Rules that keep this sellable

- Never publish invented testimonials or review counts. Demo mode discloses them as samples,
  and the live build refuses to emit rating schema.
- Never use a client's name, logo, or photos without permission.
- Never promise rankings, traffic, or sales. Promise a fast, correct, mobile-friendly site.
- Take a demo down immediately if the business asks. No arguing, no invoice.
