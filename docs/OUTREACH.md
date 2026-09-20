# Outreach: turning a demo into a paid job

The order matters. **Build the demo first, then make contact.** You are not asking them to
imagine a website. You are telling them it already exists and asking whether they want it.

## Channel ranking

1. **Phone.** Highest conversion by a wide margin, especially for trades. They are usually in a
   van or a back office and will actually talk.
2. **Walk in.** Best for shops on a quiet weekday morning, never at lunch or closing time.
   Bring a phone or tablet with the demo already loaded.
3. **Email.** Good for professional services, dentists, accountants, solicitors. Keep it to four
   short lines. You will only have an address for a minority of leads, so treat it as the second
   touch after a call, not the opening move.
4. **Instagram or Facebook DM.** The right channel for one-person businesses that live on
   social. Short, no link spam, link in the second message if they reply.

## Phone script

> "Hi, is that <name>? I'm <your name>, I'm local. I'm not selling anything, this will take
> thirty seconds. I noticed <business> comes up on Google but there's no website attached to
> your listing, so I built you one as an example. Can I text you the link? Have a look, and if
> you hate it, delete it and you'll never hear from me again."

Then stop talking. Let them answer.

If they say yes, send the link within the minute. If they ask the price, give it plainly:

> "Six hundred for the site, built and live, and forty a month if you want me to keep it
> updated and handle the hosting. No contract, cancel any time."

If they say they are not interested:

> "No problem at all. I'll take the demo down so it doesn't confuse anyone. If you ever want it,
> the number is saved." Then actually take it down.

## Walk-in script

Ask for the owner by name if you can. The line that works:

> "I built you a website. It's already live, it's on my phone, do you want to see it for thirty
> seconds?"

Owners will almost always look. Have it open before you walk in, at the top of the page, mobile
view, so the first thing they see is their own business name and their own phone number.

## Email template

Subject: `Website for <business name>`

> Hi <name>,
>
> I'm local to <town>. I noticed <business> doesn't have a website on your Google listing, so I
> built one as a demonstration. It is live here: <link>
>
> Nothing is owed and nothing is signed. If you want to keep it, it's $<price> and I'll put it
> on your own domain. If not, tell me and I'll delete it the same day.
>
> <your name>, <business name and postal address>, <phone>
> Reply "stop" and I'll remove you from my list and take the demo down.

No attachments, no images, no paragraph about your skills. One link and one price.

### Where the email addresses come from

Run `npm run enrich` (see the README) and it reads the website or social page each lead already
has, pulling the address off it. OpenStreetMap supplies a few directly. Anything you find by
hand goes into the pipeline sheet, or into a CSV in `leads/import/`, so it stays in the same
deduplicated database.

Expect an email for a minority of leads, not most. Plenty of these businesses are reachable
only by phone because they have no site to read, and Facebook and Instagram block automated
fetches. Treat email as the channel you use **in addition to** calling, not instead of it: an
address that comes back undeliverable is a wasted afternoon, a phone number that rings is a
conversation.

### Sending it without becoming a spammer

Email to a business is still commercial email, and the rules are stricter than most people
assume. The safe pattern for this kind of one-to-one outreach:

- **Send individually.** One message per business, written to that business, from your own
  address. No BCC blasts, no mail-merge tools, no shared sending domains.
- **Identify yourself honestly** and include a real postal address, not just a first name. In
  the US, CAN-SPAM requires it, and it makes you look like a local tradesperson rather than a
  bot.
- **Offer a working opt-out** in every message: replying "stop" must actually remove them, and
  it must be free and easy. Keep that promise the same day you receive it.
- **Never buy a list, and never scrape-and-blast.** A purchased list gets your domain
  blacklisted, which costs you every future client, not just the ones who complained.
- **In the UK and EU, be careful.** PECR and GDPR make business-to-business email tighter than
  people assume, and sole traders and partnerships count as individuals. One-to-one, relevant,
  clearly identified outreach is the defensible version; anything bulk is not.
- **Stop at the first no.** One follow-up at most, then mark them `dead` and move on. A
  business that asks you to stop is not a lead, it is a lawsuit with a phone number.

If you would rather not think about any of this, call instead. The phone has no compliance
overhead and it converts better anyway.

## Follow-up cadence

Most deals come from follow-up, not the first contact. Space them out:

| Day | Action |
|---|---|
| 0 | First contact (call, then email or text the link) |
| 2 | Short text: "Did you get a chance to look at the site?" |
| 5 | Call again at a different time of day |
| 12 | Send a screenshot of the demo, plus "I'm taking it down Friday if you don't want it" |
| 30 | One last short message, then stop and mark them cold |

Use a real reason to close a loop. A deadline you actually follow through on is honest and it
works. A fake one burns the lead forever.

## Objections and answers

**"I already have a Facebook page."**
> "You do, and it's doing its job. But Facebook doesn't show up when someone Googles
> '<trade> in <town>' and needs someone today. The site is the thing that catches that call."

**"I get all my work from word of mouth."**
> "That's why I built it from your reviews. Word of mouth is people looking you up after a
> friend recommends you. If they find nothing, some of them just call the next name."

**"Too expensive."**
> "Fair. What if we start with the site only, no monthly, and you pay the second half once it's
> live and you're happy with it?"

**"I need to think about it."**
> "Course. Can I leave it up while you do, or would you rather I take it down now?" Either
> answer tells you whether it's a real maybe.

**"Who gave you my number?"**
> "It's on your Google listing, which is how I found you. Happy to remove you from my list
> right now if you'd prefer."

## What never to do

- **Never claim to be from Google, or to be affiliated with any platform.** This is the single
  most common cold-call lie in this industry and it is illegal in most places.
- **Never invent reviews, ratings, or client numbers for a live site.** Demo mode discloses
  samples; a live build refuses to emit review schema.
- **Never register a domain in the client's name** without written permission. It looks like
  squatting and it kills trust instantly.
- **Never promise rankings, traffic, or sales.** Promise a fast site that is correct on mobile
  and easy to find. That is all you control.
- **Never ignore a takedown request.** Delete it the same day, cheerfully, and log it.
- **Respect anti-spam law.** In the US, CAN-SPAM requires a real physical address and a working
  opt-out in commercial email. In the UK and EU, PECR and GDPR mean business-to-business email
  is tighter than people assume: keep it one-to-one, relevant, and stop on request.

## The first week, concretely

| Day | Work |
|---|---|
| 1 | Pick one trade and one town. Build the pipeline sheet, find 30 prospects |
| 2 | Build 10 demos. Deploy them all so the links are live |
| 3 | Call 10, follow each call with the link by text or email. Log everything |
| 4 | Call 10 more, follow up day 2 leads |
| 5 | Walk into the 5 best local ones with a tablet |
| 6 to 7 | Build the follow-up list, second calls, close whoever is ready |

Thirty prospects, ten demos, twenty calls. That is a full week of real work, and it is the
cheapest possible test of whether this business suits you.
