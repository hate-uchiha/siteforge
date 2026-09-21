# SiteForge state

Snapshot taken 2026-09-21. Update this file whenever the pool, the clients, or the pipeline
move. It is the fastest way for a new session to pick up where the last one stopped.

## What this is

A static site factory for local businesses that have no website or a bad one. One JSON file per
client, one command to build, one folder to upload. See `README.md`.

## Health

Verified 2026-09-21:

- `npm run list` works: **20 niches**, 8 configured clients.
- `npm run build` works: **8/8 sites built**.
- `node test.mjs` passes: **all checks passed**. The suite now also covers live-mode figures
  and the address splitting used by the importer.
- Node v22.23.2.

The factory is in working condition. Nothing is half-finished or broken.

## Repository

- Git was initialised 2026-09-20. Branch `main`, **4 commits ahead of `origin/main`** as of
  2026-09-21 (the phone-depth layer, the live-mode figure guard, the address split, and the
  three new demos). Push when convenient; nothing is lost either way, the work is local.
- **Remote:** `git@github.com:hate-uchiha/siteforge.git`, private.
  Recoverable from anywhere with `git clone git@github.com:hate-uchiha/siteforge.git`.
- Backups also exist as `git bundle` files at `~/siteforge-<date>.bundle` and
  `/mnt/d/SiteForge-backup/`. Use `git bundle create <file> --all` after big changes.
- Git identity is configured (`Markson <hate.uchiha09@gmail.com>`). The first two commits are
  still authored as `Markson <markson@hate-uchiha.local>` from before that was set. Rewriting
  them is safe (nothing has been shared) if it ever matters:
  `git rebase --root --exec 'git commit --amend --no-edit --reset-author'` then
  `git push --force-with-lease`.
- **The repository contains third-party data**: 32 real business names with addresses and
  coordinates, plus one real email and one real phone number. It is private, so this is not
  published. If it is ever made public, strip the lead data first:
  `git rm -r --cached leads pool && echo 'leads/\npool/' >> .gitignore`.

## Lead pool

`pool/leads.json`, harvested for **Stratford, London / salon**, last updated 2026-09-21.

| Measure | Value |
| --- | --- |
| Leads | 32 |
| Tier | B 26, C 6 |
| Status | new 27, demo 5 |
| Contactable (phone or email) | **1** |
| Contacted | **0** |
| Demos built | **5** (all on The Mall, Stratford) |

Raw harvests: `leads/raw/stratford-london-mixed.json` (29), `leads/raw/stratford-london-with-sites.json` (32).

**The blocker is contactability, not volume.** Only one lead of 32 can be reached, because
OpenStreetMap records a phone number for about 7% of urban salon nodes and almost nothing for
mobile trades. Read `docs/HARVEST-FINDINGS.md` for the measurements. Short version: this pool
is a walk-in route, not a call list.

## Clients

All eight are `demo: true`, so all eight build as `noindex` with the preview banner. None are
live and none have a real domain. Five come from real harvested leads; three are preset
exercises built to test the generator.

| Client | Preset | Address | Source |
| --- | --- | --- | --- |
| `peaky-barbers` | barber | 70-73 The Mall, London, E15 1XQ | harvested |
| `ms-barber-shop` | barber | 70-73 The Mall, London, E15 1XQ | harvested |
| `lilly-nails` | nailbar | 70-73 The Mall, London, E15 1XQ | harvested |
| `broadway-beauty` | beauty | 70-73 The Mall, London, E15 1XQ | harvested |
| `zee-barbers` | barber | 61-62 The Mall, London | harvested |
| `bright-smile-dental` | dentist | 4 Bridge Street, Springfield, IL 62701 | exercise |
| `kings-barbershop` | barber | 87 High Street, London, E15 2QQ | exercise |
| `riverside-plumbing` | plumber | 128 Mill Road, Springfield, IL 62704 | exercise |

Note on presets: OpenStreetMap tags every salon, nail bar, beauty room, and barbershop as
`shop=hairdresser`, so the trade name is the only thing separating them. `tools/promote.mjs`
reads the name and routes it to `barber`, `nailbar`, or `beauty`, in that order of priority.
`nailbar` and `beauty` were added on 2026-09-21 because the two Mall demos were showing hair
salon copy to a nail bar and a beauty room, which reads as a template at the door.

## The walk route — the next thing to actually do

Five demos are built on one street. The next step is not more building: it is walking The Mall
with a phone, demos pre-loaded, and asking each owner whether they want to keep theirs. Read
`docs/OUTREACH.md` first — the walk-in script is three lines long and the whole thing works
because there is nothing to imagine.

| Order | Business | Demo | Door |
| --- | --- | --- | --- |
| 1 | Peaky Barbers | `sites/peaky-barbers` | 70-73 The Mall |
| 2 | MS Barber Shop | `sites/ms-barber-shop` | 70-73 The Mall |
| 3 | Lilly Nails | `sites/lilly-nails` | 70-73 The Mall |
| 4 | Broadway Beauty | `sites/broadway-beauty` | 70-73 The Mall |
| 5 | Zee Barbers | `sites/zee-barbers` | 61-62 The Mall |

- Go on a quiet weekday morning, never at lunch or closing time.
- Open the demo on a phone before going in, at the top of the page, so the first thing they see
  is their own name and their own address. Every site is built for a phone first.
- Nothing is live and nothing is indexed, so a demo can be shown, emailed, or taken down with no
  consequences.
- Every demo is missing a phone number, because the source data has none. Ask for it, and it goes
  straight into `clients/<slug>.json` before the site is handed over.
- If they say yes: 50% deposit, then set `demo: false`, add their domain, rebuild, deploy the
  `sites/<slug>` folder, and put the monthly care plan in front of them. See `docs/PRICING.md`.

## Commands that matter

```bash
cd ~/SiteForge
npm run list                    # niches and clients
npm run build                   # build every client
node build.mjs <slug>           # build one
npm run serve                   # preview at localhost:4173
node test.mjs                   # verify output

npm run harvest -- --area "Town, Region" --categories salon,barber
npm run pool -- --top 20
npm run enrich -- --limit 50
npm run promote -- --list
npm run promote -- <slug>
npm run promote -- <slug> --force   # re-import an existing client from the pool
```

## Companion skill

The operator layer that tells an agent how to drive this factory, plus the outreach and pricing
rules, lives outside the repository at:

```
~/.config/crush/skills/business-site-builder/SKILL.md
```

It points back here rather than duplicating the playbooks. If the repository is ever moved to a
new machine, that file is the other half and needs to travel with it.

## Next actions, in order

1. **Walk The Mall** with the five demos above. This is the only step that can produce money, and
   it needs no more code.
2. **Review the demo on a real phone** before going. Not a resized browser window.
3. **Push the local commits** if the remote should stay in sync.
4. **Harvest a second area** only after the first route has been walked once, so the next batch is
   informed by what actually happened at the door.

Done 2026-09-21: the five Mall demos, the `nailbar` and `beauty` presets so each demo shows its
own trade's services, the postcode fix, the live-mode figure guard, and the CI check.

## Do not

- Do not commit a domain or a client's assets without permission.
- Do not set `demo: false` on a site that is not actually going live.
- Do not publish invented reviews or figures. The build refuses rating schema in demo mode, and a
  live build now suppresses the preset numbers unless the client file supplies real ones. Neither
  guard may be removed to make a page look fuller.
- Do not build all 32 leads. Five on one street is the unit of work.
- Do not run `harvest` in a loop. The Overpass endpoint starts returning 504s. Use the pacing
  built into `tools/harvest.mjs`.
