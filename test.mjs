#!/usr/bin/env node
// Sanity checks for generated sites. Run after npm run build.
//   node test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig, render } from './build.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITES = path.join(ROOT, 'sites');

let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  pass  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('\nGenerated output');

const slugs = fs
  .readdirSync(SITES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

check('at least one site built', slugs.length > 0);

const PAGE_IDS = ['home', 'services', 'work', 'about', 'reviews', 'faq', 'contact'];
const pageIdFor = (dir) => (dir ? dir : 'home');
const pageDirFor = (page) => (page === 'home' ? '' : page);

// Sections that only belong to one page. If one of these turns up elsewhere the
// site has silently gone back to being one long page.
const HOME_ONLY = ['class="hero"', 'hero-grid'];
const SUBPAGE_HEAD = 'class="page-head"';

for (const slug of slugs) {
  const root = path.join(SITES, slug);
  const sitePages = [];
  console.log(`\n${slug}`);

  for (const page of PAGE_IDS) {
    const dir = path.join(root, pageDirFor(page));
    const file = path.join(dir, 'index.html');
    if (!fs.existsSync(file)) {
      check(`${page} page exists`, false, `missing ${path.relative(ROOT, file)}`);
      continue;
    }
    sitePages.push({ page, dir, file, html: fs.readFileSync(file, 'utf8') });
  }

  check('every page in the registry is generated', sitePages.length === PAGE_IDS.length, `${sitePages.length}/${PAGE_IDS.length}`);

  const prefixFor = (page) => (page === 'home' ? '' : '../');

  for (const { page, dir, html } of sitePages) {
    const prefix = prefixFor(page);
    const label = `[${page}]`;

    check(`${label} no unresolved template values`, !/\bundefined\b|\[object Object\]|NaN/.test(html));
    check(`${label} exactly one h1`, (html.match(/<h1>/g) || []).length === 1);
    check(`${label} has a title`, /<title>[^<]{5,}<\/title>/.test(html));
    check(`${label} meta description`, /name="description" content="[^"]{40,}"/.test(html));
    check(`${label} lang set`, /<html lang="/.test(html));
    check(`${label} viewport meta`, html.includes('name="viewport"'));
    check(`${label} skip link`, html.includes('class="skip"'));
    check(`${label} shared header`, html.includes('<header class="site-header"'));
    check(`${label} shared footer`, html.includes('<footer class="site-footer"'));
    check(`${label} call bar`, html.includes('callbar'));
    check(`${label} noindex in demo`, html.includes('noindex'));
    check(`${label} demo banner`, html.includes('class="demobar"'));
    check(`${label} labelled form fields`, !/<input(?![^>]*id=)[^>]*>/.test(html));
    check(`${label} stylesheet path`, html.includes(`href="${prefix}styles.css"`));
    check(`${label} script path`, html.includes(`src="${prefix}app.js"`));

    const ldBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    let ldOk = ldBlocks.length > 0;
    for (const block of ldBlocks) {
      const bodyText = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      try {
        JSON.parse(bodyText);
      } catch (error) {
        ldOk = false;
        check(`${label} JSON-LD parses`, false, error.message);
      }
    }
    check(`${label} JSON-LD parses`, ldOk, `${ldBlocks.length} block(s)`);

    const navLinks = html.match(/<a href="[^"]*"(?: aria-current="page")?>/g) || [];
    const current = navLinks.filter((a) => a.includes('aria-current')).length;
    check(`${label} marks one current nav item`, current === (page === 'home' ? 0 : 1), `${current} marked`);

    if (page === 'home') {
      for (const need of HOME_ONLY) check(`${label} contains ${need}`, html.includes(need));
      for (const block of ['id="services"', 'id="why"', 'id="areas"', 'id="quote"']) {
        check(`${label} contains ${block}`, html.includes(block));
      }
      // The FAQ list lives on its own page now; a home page that also carried it
      // would undo the split.
      check(`${label} does not duplicate id="faq"`, !html.includes('id="faq"'));
    } else {
      check(`${label} uses the subpage head`, html.includes(SUBPAGE_HEAD));
      check(`${label} is not a second home page`, !html.includes(SUBPAGE_HEAD + ' hero-grid'));
    }
  }

  // A multi-page site fails in one specific way: a link that points at a page
  // nobody generated, or an anchor that exists on a different page. Both are
  // silent in a browser, so they are asserted here instead.
  const brokenLinks = [];
  for (const { page, dir, html } of sitePages) {
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(target)) {
        if (target.startsWith('#') && target.length > 1) {
          const id = target.slice(1);
          if (!html.includes(`id="${id}"`)) brokenLinks.push(`[${page}] ${target} has no matching id on this page`);
        }
        continue;
      }
      const clean = target.split('#')[0].split('?')[0];
      if (!clean) continue;
      const resolved = path.resolve(dir, clean);
      const candidates = [resolved, path.join(resolved, 'index.html')];
      if (!candidates.some((candidate) => fs.existsSync(candidate))) {
        brokenLinks.push(`[${page}] ${target} -> ${path.relative(root, resolved)}`);
      }
    }
  }
  check('no broken internal links', brokenLinks.length === 0, brokenLinks.slice(0, 4).join(' | '));

  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const listed = (sitemap.match(/<loc>/g) || []).length;
  check('sitemap lists every page', listed === PAGE_IDS.length, `${listed} url(s)`);

  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  check('robots disallows in demo', robots.includes('Disallow: /'));

  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  check('theme variables injected', css.includes('--brand:') && css.includes('--on-brand:'));
  check('no unsafe font fallback gap', css.includes('--font-body:'));
}

console.log('\nDepth');

const barberHome = fs.readFileSync(path.join(SITES, 'peaky-barbers', 'index.html'), 'utf8');
const barberServices = fs.readFileSync(path.join(SITES, 'peaky-barbers', 'services', 'index.html'), 'utf8');
const barberCss = fs.readFileSync(path.join(SITES, 'peaky-barbers', 'styles.css'), 'utf8');

// Depth is easy to lose quietly: a missing perspective on one container flattens a
// whole child's translateZ and nothing in the output looks wrong.
check('home band carries a backdrop plane', /class="band-art"[\s\S]*class="plane"/.test(barberHome));
check('the backdrop reuses the same asset, not a second file', (() => {
  const plane = barberHome.match(/class="plane"[^>]*url\('([^']+)'\)/);
  const img = barberHome.match(/<img src="(img\/hero\.webp)"/);
  return Boolean(plane && img && plane[1] === img[1]);
})());
check('band pieces opt into parallax', /class="plane" data-depth="/.test(barberHome));
check('subpages get a depth panel', /class="page-head-card" data-depth="/.test(barberServices));
check('the services page explains the process', barberServices.includes('class="steps"'));
check('depth layers survive into the built css', barberCss.includes('translateZ') && barberCss.includes('perspective'));
check('reduced motion turns the depth off', /prefers-reduced-motion[\s\S]*transform: none !important/.test(barberCss));
check('the runtime knows about depth elements', fs.readFileSync(path.join(ROOT, 'assets', 'app.js'), 'utf8').includes("querySelectorAll('[data-depth]')"));

console.log('\nLive mode (demo: false)');
const live = mergeConfig({
  slug: 'live-check',
  preset: 'electrician',
  demo: false,
  business: {
    name: 'Live Check Electrical',
    phone: '+1 555 0100',
    domain: 'livecheck.example',
    address: { city: 'Springfield' },
    areas: ['Springfield'],
    rating: { value: '4.9', count: 128 },
  },
});
const liveOut = render(live);

check('no demo banner in live mode', !liveOut.html.includes('class="demobar"'));
check('live mode is indexable', liveOut.html.includes('content="index, follow"'));
check('canonical uses the domain', liveOut.html.includes('<link rel="canonical" href="https://livecheck.example">'));
check('aggregateRating only in live mode', liveOut.html.includes('aggregateRating'));
check('sitemap url uses the domain', liveOut.html.includes('livecheck.example'));
check('live mode omits the preset sample figures', !liveOut.html.includes('class="stats reveal"'));

const liveWithStats = render(
  mergeConfig({
    slug: 'live-stats-check',
    preset: 'electrician',
    demo: false,
    business: { name: 'Live Stats Electrical', domain: 'livestats.example' },
    stats: [{ value: '9', label: 'Engineers on the road' }],
  })
);
check(
  'live mode renders figures the client supplied',
  liveWithStats.html.includes('9') && liveWithStats.html.includes('Engineers on the road')
);

const demoOut = render(mergeConfig({ slug: 'demo-check', preset: 'electrician', business: { name: 'Demo Check' } }));
check('no aggregateRating in demo mode', !demoOut.html.includes('aggregateRating'));
check('demo keeps the sample figures', demoOut.html.includes('class="stats reveal"') && demoOut.html.includes('2,100+'));

console.log('\nImagery');

const artistic = mergeConfig({ slug: 'peaky-barbers', preset: 'barber', business: { name: 'Peaky Barbers' } });
const artisticOut = render(artistic);

check('demo uses the preset sample artwork', artisticOut.html.includes('class="band-art"'));
check('sample artwork is disclosed on the page', artisticOut.html.includes('sample-tag'));
check('sample artwork is hidden from screen readers', artisticOut.html.includes('aria-hidden="true"'));
check('every image carries its dimensions', /<img [^>]*src="img\/[^"]+"[^>]*width="\d+"[^>]*height="\d+"/.test(artisticOut.html));
check('the hero image is not lazy loaded', /<img [^>]*img\/hero[^>]*fetchpriority="high"[^>]*>/.test(artisticOut.html));
check('gallery tiles are lazy loaded', (artisticOut.html.match(/loading="lazy"/g) || []).length >= 3);
check('a social card is linked', artisticOut.html.includes('property="og:image"'));
check('the same still is never used on two tiles', (() => {
  const srcs = [...artisticOut.html.matchAll(/<img src="img\/craft-(\d+)\.webp"/g)].map((m) => m[1]);
  return new Set(srcs).size === srcs.length;
})());

const noArt = mergeConfig({ slug: 'plain-electrician', preset: 'electrician', business: { name: 'Plain Sparks' } });
const noArtOut = render(noArt);
check('a preset with no artwork renders no empty image tags', !/<img[^>]*src="(undefined|)"/.test(noArtOut.html));
check('no invented sample art for a trade that has none', !noArtOut.html.includes('class="band-art"'));

// The integrity rule: generic trade art must never reach a live site as evidence.
const liveArt = mergeConfig({
  slug: 'live-art-check',
  preset: 'barber',
  demo: false,
  business: { name: 'Live Art Barbers', domain: 'liveart.example' },
});
const liveArtOut = render(liveArt);
check('live mode drops sample trade art', !liveArtOut.html.includes('class="band-art"'));
check('live mode drops a gallery of sample art', !liveArtOut.html.includes('id="work"'));
check('live mode keeps a real photo the client supplied', (() => {
  const withPhoto = mergeConfig({
    slug: 'live-photo-check',
    preset: 'barber',
    demo: false,
    business: { name: 'Real Photo Barbers', domain: 'realphoto.example' },
    images: { hero: 'assets/presets/barber/hero.webp' },
  });
  const out = render(withPhoto);
  return out.html.includes('class="band-art"') && out.html.includes('assets/presets/barber/hero.webp'.split('/').pop());
})());
check('a missing image path is ignored, not rendered', (() => {
  const broken = mergeConfig({
    slug: 'broken-image-check',
    preset: 'barber',
    demo: false,
    business: { name: 'Broken Image Barbers' },
    images: { hero: 'assets/does/not/exist.webp' },
  });
  return !render(broken).html.includes('class="band-art"');
})());

console.log('\nLead import (addresses OpenStreetMap returns as one string)');
const { parseAddress } = await import('./tools/promote.mjs');

const mall = parseAddress({ address: '70-73 The Mall, London, E15 1XQ', city: 'London' });
check(
  'postcode is split out of the address',
  mall.street === '70-73 The Mall' && mall.postalCode === 'E15 1XQ',
  JSON.stringify(mall)
);

const broadway = parseAddress({ address: '40 Broadway, London, E15 4QS, GB', city: 'London' });
check(
  'country code is dropped, not printed',
  broadway.postalCode === 'E15 4QS' && !broadway.country && !broadway.street.includes('GB'),
  JSON.stringify(broadway)
);

const cityOnly = parseAddress({ address: 'London', city: 'London' });
check('a city-only address is not printed twice', cityOnly.street === '', JSON.stringify(cityOnly));
check('an empty lead does not throw', parseAddress({}).street === '');

console.log(`\n${failures ? `${failures} failure(s)` : 'all checks passed'}\n`);
if (failures) process.exit(1);
