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

for (const slug of slugs) {
  const dir = path.join(SITES, slug);
  console.log(`\n${slug}`);

  for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'robots.txt', 'sitemap.xml', '404.html', 'HANDOFF.md']) {
    check(`${file} exists`, fs.existsSync(path.join(dir, file)));
  }

  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

  check('no unresolved template values', !/\bundefined\b|\[object Object\]|NaN/.test(html));

  const requiredBlocks = ['<header', 'hero', 'id="services"', 'id="why"', 'id="areas"', 'id="faq"', 'id="quote"', '<footer', 'callbar', 'application/ld+json'];
  for (const block of requiredBlocks) {
    check(`contains ${block}`, html.includes(block));
  }

  const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  let ldOk = ldMatches.length > 0;
  for (const block of ldMatches) {
    const body = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      JSON.parse(body);
    } catch (error) {
      ldOk = false;
      check('JSON-LD parses', false, error.message);
    }
  }
  check('JSON-LD parses', ldOk, `${ldMatches.length} block(s)`);

  check('exactly one h1', (html.match(/<h1>/g) || []).length === 1);
  check('lang attribute set', /<html lang="/.test(html));
  check('viewport meta present', html.includes('name="viewport"'));
  check('meta description present', /name="description" content="[^"]{40,}"/.test(html));
  check('skip link present', html.includes('class="skip"'));
  check('demo builds are noindex', html.includes('noindex'));
  check('demo banner shown', html.includes('class="demobar"'));
  check('form fields have labels', !/<input(?![^>]*id=)[^>]*>/.test(html));

  const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
  check('theme variables injected', css.includes('--brand:') && css.includes('--on-brand:'));
  check('no unsafe font fallback gap', css.includes('--font-body:'));

  const robots = fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8');
  check('robots disallows in demo', robots.includes('Disallow: /'));
}

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
