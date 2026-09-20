# SiteForge state

Snapshot taken 2026-09-20. Update this file whenever the pool, the clients, or the pipeline
move. It is the fastest way for a new session to pick up where the last one stopped.

## What this is

A static site factory for local businesses that have no website or a bad one. One JSON file per
client, one command to build, one folder to upload. See `README.md`.

## Health

Verified 2026-09-20:

- `npm run list` works: **18 niches**, 4 configured clients.
- `npm run build` works: **4/4 sites built**.
- `node test.mjs` passes: **all checks passed**, including the demo and live mode safety checks.
- Node v22.23.2.

The factory is in working condition. Nothing is half-finished or broken.

## Repository

- Git was initialised 2026-09-20. First commit `ba3bd9a`, 69 files.
- **There is no remote.** This history exists only on this machine. Losing the disk loses it.
- Committed with a local identity (`Markson <markson@hate-uchiha.local>`) because no git
  identity was configured. To correct it:

  ```bash
  git config user.name "Your Name"
  git config user.email "you@example.com"
  git commit --amend --reset-author
  ```

## Lead pool

`pool/leads.json`, last updated 2026-09-18, harvested for **Stratford, London / salon**.

| Measure | Value |
| --- | --- |
| Leads | 32 |
| Tier | B 26, C 6 |
| Status | new 31, demo 1 |
| Contactable (phone or email) | **1** |
| Contacted | **0** |
| Demo built | 1 (peaky-barbers) |

Raw harvests: `leads/raw/stratford-london-mixed.json` (29), `leads/raw/stratford-london-with-sites.json` (32).

**The blocker is contactability, not volume.** Only one lead of 32 can be reached, because
OpenStreetMap records a phone number for about 7% of urban salon nodes and almost nothing for
mobile trades. Read `docs/HARVEST-FINDINGS.md` for the measurements. Short version: this pool
is a walk-in route, not a call list.

## Clients

All four are `demo: true`, so all four build as `noindex` with the preview banner. None are
live and none have a real domain.

| Client | Preset |
| --- | --- |
| `bright-smile-dental` | dentist |
| `kings-barbershop` | barber |
| `peaky-barbers` | salon |
| `riverside-plumbing` | plumber |

Only `peaky-barbers` came from a real harvested lead. The other three look like preset
exercises.

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

1. **Add a git remote and push.** The whole project exists on one disk. This is the highest
   value action available and it costs nothing.
2. **Decide the trade and the area**, using `docs/HARVEST-FINDINGS.md`. Shops mean walk-ins,
   not phone calls. Mobile trades are not in OpenStreetMap and must be found by hand.
3. **Build 3 to 5 demos on one street, then walk it.** Do not build 32.
4. **Correct the git identity** if the commit author matters.

## Do not

- Do not commit a domain or a client's assets without permission.
- Do not set `demo: false` on a site that is not actually going live.
- Do not publish invented reviews. The build already refuses rating schema in demo mode.
- Do not run `harvest` in a loop. The Overpass endpoint starts returning 504s. Use the pacing
  built into `tools/harvest.mjs`.
