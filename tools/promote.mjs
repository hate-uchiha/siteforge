#!/usr/bin/env node
// Promote a pooled lead into a buildable client file.
//
//   node tools/promote.mjs --list                show the best unpromoted leads
//   node tools/promote.mjs --list --tier A       only tier A
//   node tools/promote.mjs lead-1234             create clients/<slug>.json from that lead
//   node tools/promote.mjs "Riverside Plumbing"  match by name
//   node tools/promote.mjs lead-1234 --force     overwrite an existing client file
//
// After promoting: node build.mjs <slug>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POOL_JSON = path.join(ROOT, 'pool', 'leads.json');
const CLIENT_DIR = path.join(ROOT, 'clients');

/* ---------- args ---------- */

function parseArgs(argv) {
  const out = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--list') out.list = true;
    else if (arg === '--tier') out.tier = argv[++i];
    else if (arg === '--force') out.force = true;
    else if (arg === '--limit') out.limit = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') out.help = true;
    else out.positional.push(arg);
  }
  return out;
}

function usage() {
  console.log(`Usage:
  node tools/promote.mjs --list [--tier A] [--limit 25]
  node tools/promote.mjs <lead id or name> [--force]

Promoting writes clients/<slug>.json with demo mode on, ready for:
  node build.mjs <slug>`);
}

/* ---------- opening hours ---------- */

const DAY_INDEX = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseHours(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (/^24\/7$/.test(text)) {
    return { mon: 'Open 24 hours', tue: 'Open 24 hours', wed: 'Open 24 hours', thu: 'Open 24 hours', fri: 'Open 24 hours', sat: 'Open 24 hours', sun: 'Open 24 hours' };
  }

  const days = {};

  const expandDays = (spec) => {
    const result = [];
    for (const part of spec.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
      if (part === 'ph') continue;
      const range = part.match(/^([a-z]{2})\s*-\s*([a-z]{2})$/);
      if (range && DAY_INDEX[range[1]] != null && DAY_INDEX[range[2]] != null) {
        let from = DAY_INDEX[range[1]];
        const to = DAY_INDEX[range[2]];
        // OSM weeks run Monday to Sunday, so wrap forward from the start day.
        for (let step = 0; step < 7; step += 1) {
          const day = ((from - 1 + step + 7) % 7) + 1;
          result.push(day);
          if (day === to) break;
        }
        continue;
      }
      if (DAY_INDEX[part] != null) result.push(DAY_INDEX[part]);
    }
    return result;
  };

  for (const rule of text.split(';')) {
    const trimmed = rule.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([A-Za-z,\-\s]+?)\s+(.*)$/);
    if (!match) continue;

    const dayList = expandDays(match[1]);
    const timePart = match[2].trim();

    if (/^(off|closed)$/i.test(timePart)) {
      dayList.forEach((day) => {
        days[DAY_KEYS[day]] = 'Closed';
      });
      continue;
    }

    const ranges = timePart.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/g) || [];
    if (!ranges.length) continue;

    const label = ranges
      .map((r) => r.split('-').map((t) => t.trim()).join(' to '))
      .join(' and ');

    dayList.forEach((day) => {
      days[DAY_KEYS[day]] = label;
    });
  }

  if (!Object.keys(days).length) return null;

  DAY_KEYS.forEach((key) => {
    if (!days[key]) days[key] = 'Closed';
  });

  return days;
}

/* ---------- config ---------- */

const CATEGORY_TO_PRESET = {
  plumber: 'plumber',
  electrician: 'electrician',
  hvac: 'hvac',
  landscaper: 'landscaper',
  cleaning: 'cleaning',
  autodetailing: 'autodetailing',
  salon: 'salon',
  barber: 'barber',
  gym: 'gym',
  dentist: 'dentist',
  restaurant: 'restaurant',
  photographer: 'photographer',
  realestate: 'realestate',
  tutor: 'tutor',
  handyman: 'handyman',
  petgrooming: 'petgrooming',
  accountant: 'accountant',
  lawyer: 'lawyer',
};

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function clientConfig(lead, preset, hours, areas) {
  const address = {
    street: lead.address ? String(lead.address).split(',')[0].trim() : '',
    city: lead.city || '',
    region: lead.region || '',
    postalCode: '',
    country: lead.country || '',
  };

  return {
    slug: slugify(lead.name),
    preset,
    demo: true,
    business: {
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email || '',
      address,
      geo: lead.lat && lead.lon ? { lat: Number(lead.lat), lng: Number(lead.lon) } : undefined,
      areas,
      hours: hours || undefined,
      formEndpoint: '',
      domain: '',
    },
    testimonials: [],
    stats: undefined,
    trust: undefined,
    services: undefined,
    faq: undefined,
    gallery: undefined,
    _source: lead.sourceUrl || lead.id,
    _score: lead.score,
  };
}

/* ---------- main ---------- */

function loadPool() {
  if (!fs.existsSync(POOL_JSON)) {
    console.error('No pool yet. Run: node tools/harvest.mjs --area "..." --all  then  node tools/pool.mjs');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(POOL_JSON, 'utf8'));
}

function loadClients() {
  if (!fs.existsSync(CLIENT_DIR)) return [];
  return fs.readdirSync(CLIENT_DIR).filter((f) => f.endsWith('.json'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  const pool = loadPool();
  const leads = pool.leads || [];
  const clients = loadClients();
  const promoted = new Set(clients.map((f) => f.replace(/\.json$/, '')));

  if (args.list || !args.positional.length) {
    const open = leads
      .filter((l) => l.websiteStatus !== 'has_site')
      .filter((l) => !args.tier || l.tier === args.tier)
      .filter((l) => !promoted.has(slugify(l.name)));

    const limit = args.limit || 25;
    console.log(`${open.length} unpromoted leads, showing ${Math.min(limit, open.length)}:\n`);

    for (const lead of open.slice(0, limit)) {
      const flags = [lead.websiteStatus === 'none' ? 'no site' : 'social only', lead.phone ? 'phone' : 'NO PHONE', lead.tier].join(', ');
      console.log(`  ${String(lead.score).padStart(3)}  ${slugify(lead.name).padEnd(30)} ${String(lead.category || '-').padEnd(13)} ${flags}`);
      console.log(`       ${lead.name}${lead.city ? `, ${lead.city}` : ''}`);
    }

    if (!open.length) console.log('  nothing left. Harvest another area or trade.');
    console.log('\nPromote one with:  node tools/promote.mjs <slug or name>');
    return;
  }

  const query = args.positional.join(' ').toLowerCase();
  const match =
    leads.find((l) => l.id === args.positional[0]) ||
    leads.find((l) => slugify(l.name) === slugify(query)) ||
    leads.find((l) => String(l.name).toLowerCase().includes(query));

  if (!match) {
    console.error(`No lead matched "${args.positional.join(' ')}". Run with --list to see options.`);
    process.exit(1);
  }

  const preset = CATEGORY_TO_PRESET[match.category];
  if (!preset) {
    console.error(`Lead "${match.name}" has no mapped trade (category: ${match.category || 'none'}).`);
    console.error(`Set one of: ${Object.keys(CATEGORY_TO_PRESET).join(', ')}`);
    process.exit(1);
  }

  const slug = slugify(match.name);
  const target = path.join(CLIENT_DIR, `${slug}.json`);

  if (fs.existsSync(target) && !args.force) {
    console.error(`clients/${slug}.json already exists. Use --force to overwrite.`);
    process.exit(1);
  }

  // Nearby leads in the same city make a credible service area list.
  const nearby = [...new Set(leads.filter((l) => l.city && l.city === match.city).map((l) => l.city))];
  const areas = nearby.length >= 1 ? [match.city, ...(match.region ? [match.region] : [])].filter(Boolean) : [match.city].filter(Boolean);

  const hours = parseHours(match.hoursRaw);
  const config = clientConfig(match, preset, hours, areas);

  fs.mkdirSync(CLIENT_DIR, { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);

  match.status = 'demo';
  match.demoBuilt = true;
  fs.writeFileSync(POOL_JSON, JSON.stringify(Object.assign({}, pool, { updatedAt: new Date().toISOString() }), null, 2));

  console.log(`promoted ${match.name} -> clients/${slug}.json`);
  console.log(`  preset   : ${preset}`);
  console.log(`  phone    : ${match.phone || '(none, add one manually)'}`);
  console.log(`  email    : ${match.email || '(none, run node tools/enrich.mjs or add one manually)'}`);
  console.log(`  hours    : ${hours ? 'parsed from OpenStreetMap' : 'using preset defaults'}`);
  console.log(`  source   : ${match.sourceUrl || 'imported'}`);
  console.log(`\nNext:\n  node build.mjs ${slug}\n  npm run serve`);
}

main();
