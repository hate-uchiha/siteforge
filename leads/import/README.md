# CSV imports

Drop any `.csv` here and `npm run pool` merges it into `pool/leads.json` alongside the
OpenStreetMap harvests. This is how manual prospecting gets into the same scored, deduplicated
database as the automated harvest.

Headers are matched loosely and case-insensitively, so any of these work:

| Field | Accepted headers |
|---|---|
| Business name | `name`, `business`, `business name`, `company` |
| Trade | `category`, `trade`, `niche`, `industry` |
| Phone | `phone`, `telephone`, `tel`, `mobile`, `number` |
| Email | `email`, `e-mail`, `mail` |
| Other emails | `emails`, `all emails` (separate with `|` or `;`) |
| Where a value came from | `phone source`, `email source` |
| Website | `website`, `site`, `url`, `web` |
| Social page | `social`, `facebook`, `instagram`, `social url` |
| Website status | `website status` (`none`, `social only`, `has site`) |
| Opening hours | `hours`, `opening hours`, `opening_hours` |
| Location | `address`, `city` / `town` / `locality`, `region` / `state` / `county`, `country` |
| Coordinates | `lat` / `latitude`, `lon` / `lng` / `longitude` |
| Pipeline | `status`, `notes`, `contacted` / `contacted at`, `demo built` |
| Provenance | `source`, `source url` |

If `website status` is blank, it is inferred: no website means `none`, and a Facebook,
Instagram, or Linktree link means `social only`.

Leads are deduplicated by phone number, and also by name plus town, so re-importing a refreshed
export updates the existing record rather than creating duplicates. Keep the `name` and `city`
columns in your export and a row still matches after someone adds a phone number the harvester
did not have. Anything you set in `status`, `notes`, or `contacted` is preserved when the pool is
rebuilt, and a blank cell never erases a value another source already supplied.

Exports from Google Maps scrapers, Checkatrade, Yelp, Bark, and a hand-kept spreadsheet all
work as long as the columns land on the headers above.
