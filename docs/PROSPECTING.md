# Prospecting: finding businesses with no website

The whole model depends on finding businesses that are **already winning** but have **no web
presence**. A business with no customers will not pay you. A business with plenty of customers
and no website has money coming in and no idea how much it is leaving on the table.

## Start with the harvester

There is no point opening Google Maps until you have exhausted the free bulk source. Run the
pipeline for the town and trade you care about:

```bash
npm run harvest -- --area "Stratford, London" --categories salon,barber
npm run pool -- --top 20
npm run promote -- --list
```

OpenStreetMap already knows the name, address, coordinates, opening hours, and often the phone
number of every hairdresser, plumber, and dentist on a high street, and it is free to query.
The pool scores each one and ranks the callable ones first, so you spend your manual hours on
the leads the machine could not reach, not on ones it already found.

Two caveats. Coverage is uneven: salons, dentists, and gyms are well mapped, while mobile
trades and anything small or new is often missing, which is what the manual methods below are
for. And OSM proves a business exists, not that it is doing well, so it cannot answer
requirement one on its own. Confirm a lead is trading before you build for it.

## The ideal prospect

Three boxes, all required:

1. **Clearly trading.** Reviews from the last 60 days, phone answered, staff visible, van on the
   road, or a queue at the door.
2. **No real website.** The Google Business Profile website field is blank, or it points to a
   Facebook page, or it points to a domain that is dead, broken on mobile, or a decade old.
3. **Reachable.** You can get a phone number, and ideally an email or a door to walk through.

## Where "doing well" shows up

| Signal | Where to look |
|---|---|
| 20+ reviews, several in the last month | Google Maps, Yelp, Trustpilot, Checkatrade, Thumbtack |
| Ranked in the local pack for their trade | Google search, "<trade> near me" |
| Running paid ads | "Sponsored" tag on Google results. They already spend money on leads |
| Multiple vans, staff, or locations | Photos, job ads, van livery |
| Active social posting | Instagram, Facebook |
| Recently expanded or rebranded | Local news, new signage, new units |

The ads signal is the strongest one. A business paying for clicks and sending them to a
Facebook page or a broken site is losing money every single day. That is the easiest pitch in
the world to make, because you can quantify it.

## Where to hunt, roughly in order of yield

1. **Google Maps, manual search.** Search `<trade> in <town>`, open each listing, look at the
   website field. Blank or a Facebook link means prospect. Work one trade per session so your
   demo can be built from the same preset, and one town at a time so you can talk about their
   area convincingly.
2. **Facebook Pages.** Businesses that run entirely from a Page usually have a phone number in
   the About tab and no site. Very high hit rate in trades, salons, and food.
3. **Instagram-only businesses.** Personal trainers, tattoo artists, bakers, mobile detailing.
   Their link in bio is a Linktree. Direct message is the right channel here.
4. **Trade directories.** Checkatrade, Yelp, Bark, Thumbtack, local chamber listings. Many
   directory-only businesses have no site of their own.
5. **Physical noticing.** Drive or walk the high street. Van signage with a phone number and no
   web address is a live lead.
6. **Local Facebook groups.** Search "recommend a <trade>" posts. The names that come up
   repeatedly are the ones doing well.

## Keep a pipeline sheet

One row per prospect, columns:

`business | trade | town | phone | email | website status | review count | last review | demo built? | contacted (dates) | outcome | notes`

Track **dates on every contact**. Follow-up timing is what closes deals, not clever copy.

## Volume math

Assume cold outreach converts like this:

- 100 qualified prospects in the sheet
- 60 answered or reachable
- 25 look at the demo
- 5 to 8 conversations about price
- **2 to 4 paying clients**

At $600 average for a build plus a $40 per month care plan, that first 100 prospects is roughly
$1,200 to $2,400 up front and $80 to $160 per month recurring. The recurring part compounds:
every prospecting round you repeat adds to it. Twenty care-plan clients at $40 is $800 a month
for almost no work.

## Two things that make a demo land

**Get the details right.** Use their real business name, real phone number, real opening hours
from their Google listing, their real town, and the services they actually advertise. A demo
that is wrong about the basics gets deleted. A demo that is right looks like you already work
for them.

**Batch it.** Build demos for five prospects, then make five calls. SiteForge builds one site in
under a minute once the JSON is filled in, so a batch of five is an afternoon. Momentum matters
more than perfection, and a filled pipeline beats one perfect demo sitting in a folder.
