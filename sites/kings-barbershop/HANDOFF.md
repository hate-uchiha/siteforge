# Kings Barbershop handoff notes

Built with SiteForge from the `barber` preset in demo mode.

## Replace before launch

- [ ] Business name, phone, email, address, opening hours in `clients/kings-barbershop.json`, then rebuild
- [ ] Gallery tiles: real job photos in `clients/kings-barbershop.json` then rebuild
- [ ] Testimonials: real quotes only, never invented ones
- [ ] Form endpoint: set `business.formEndpoint` (Formspree, Netlify Forms, or your own handler)
- [ ] `business.domain` so canonical, sitemap, and OG tags are correct
- [ ] Set `demo: false` so the banner disappears and search engines may index the site
- [ ] Add analytics if the client wants it
- [ ] Demo mode is ON: the site is noindex and shows a preview banner

## Deploy (free tier)

1. Create a project on Cloudflare Pages or Netlify, drag the `sites/kings-barbershop` folder in
2. Point the client's domain at it and switch the SSL on
3. Rebuild and re-upload whenever content changes: `node build.mjs kings-barbershop`
