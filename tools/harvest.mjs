#!/usr/bin/env node
// Bulk lead harvester. Pulls businesses straight out of OpenStreetMap via the Overpass API,
// keeps the ones with no website of their own, and writes a raw lead file.
//
//   node tools/harvest.mjs --area "Stratford, London" --categories salon,barber
//   node tools/harvest.mjs --bbox 51.52,-0.03,51.56,0.02 --all --limit 5000
//   node tools/harvest.mjs --area "Springfield, IL" --categories plumber,handyman --out springfield-trades
//
// OpenStreetMap data is open (ODbL). Overpass and Nominatim are free public services: this
// script makes one request per area and one geocode per new place name, and identifies itself.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, categoryIds, isSocialUrl } from './categories.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEAD_DIR = path.join(ROOT, 'leads');
const RAW_DIR = path.join(LEAD_DIR, 'raw');
const CACHE_FILE = path.join(LEAD_DIR, '.geocache.json');
const UA = 'SiteForge-lead-research/1.0 (local business website prospecting)';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
];

/* ---------- args ---------- */

function parseArgs(argv) {
  const out = { categories: [], all: false, limit: 4000, delay: 1200 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--area') out.area = next();
    else if (arg === '--bbox') out.bbox = next();
    else if (arg === '--categories') out.categories.push(...String(next()).split(',').map((s) => s.trim()).filter(Boolean));
    else if (arg === '--all') out.all = true;
    else if (arg === '--limit') out.limit = Number(next());
    else if (arg === '--delay') out.delay = Number(next());
    else if (arg === '--out') out.out = next();
    else if (arg === '--include-with-website') out.includeAll = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function usage() {
  console.log(`Usage:
  node tools/harvest.mjs --area "Town, Region" --categories salon,barber
  node tools/harvest.mjs --bbox south,west,north,east --all

Options:
  --area <name>          place name, geocoded to a bounding box
  --bbox <s,w,n,e>       explicit bounding box instead of --area
  --categories <list>    comma separated preset ids, or --all
  --limit <n>            max elements returned per request (default 4000)
  --out <name>           output file name (default derived from area)
  --include-with-website keep businesses that already have a site (for research only)
  --delay <ms>           pause between Overpass requests (default 1200)

Categories: ${categoryIds().join(', ')}`);
}

/* ---------- geocoding ---------- */

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.mkdirSync(LEAD_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function geocode(area) {
  const cache = readCache();
  const key = area.trim().toLowerCase();
  if (cache[key]) return cache[key];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area)}&format=json&limit=1`;
  const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

  const results = await response.json();
  if (!results.length) throw new Error(`Could not find a place called "${area}"`);

  const first = results[0];
  // Nominatim order is south, north, west, east. Overpass needs south, west, north, east.
  const [south, north, west, east] = first.boundingbox.map(Number);
  const record = { label: first.display_name, bbox: [south, west, north, east], lat: Number(first.lat), lon: Number(first.lon) };

  cache[key] = record;
  writeCache(cache);
  await sleep(1100); // Nominatim asks for a maximum of one request per second
  return record;
}

/* ---------- overpass ---------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildQuery(bbox, categories, limit) {
  const filters = [];
  for (const id of categories) {
    for (const [key, value] of CATEGORIES[id].tags) {
      filters.push(`  nwr["${key}"="${value}"](${bbox.join(',')});`);
    }
  }

  return `[out:json][timeout:180];
(
${filters.join('\n')}
);
out center tags ${limit};`;
}

async function overpass(query) {
  let lastError;
  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[attempt];
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(200000),
      });

      if (!response.ok) throw new Error(`${response.status} from ${endpoint}`);
      const payload = await response.json();
      return { payload, endpoint };
    } catch (error) {
      lastError = error;
      console.warn(`  retry: ${error.message}`);
      await sleep(2500);
    }
  }
  throw lastError;
}

/* ---------- tag normalisation ---------- */

const first = (tags, keys) => {
  for (const key of keys) {
    const value = tags[key];
    if (value && String(value).trim()) return String(value).trim();
  }
  return '';
};

function buildAddress(tags) {
  const street = [first(tags, ['addr:housenumber']), first(tags, ['addr:street', 'addr:place'])].filter(Boolean).join(' ');
  return {
    street: street || first(tags, ['addr:place']),
    city: first(tags, ['addr:city', 'addr:town', 'addr:suburb', 'addr:village']),
    region: first(tags, ['addr:state', 'addr:province', 'addr:county']),
    postalCode: first(tags, ['addr:postcode']),
    country: first(tags, ['addr:country']),
  };
}

function categoryFor(tags) {
  for (const id of categoryIds()) {
    for (const [key, value] of CATEGORIES[id].tags) {
      if (tags[key] === value) return id;
    }
  }
  return '';
}

function toLead(element, areaLabel) {
  const tags = element.tags || {};
  const name = first(tags, ['name', 'operator', 'brand']);
  if (!name) return null;

  const website = first(tags, ['website', 'contact:website', 'url', 'contact:url']);
  const social = [first(tags, ['contact:facebook', 'facebook']), first(tags, ['contact:instagram', 'instagram'])]
    .filter(Boolean)
    .join(' ');
  const lat = element.lat ?? element.center?.lat ?? '';
  const lon = element.lon ?? element.center?.lon ?? '';
  const category = categoryFor(tags);

  return {
    id: `osm-${element.type}-${element.id}`,
    source: 'openstreetmap',
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    category,
    name,
    phone: first(tags, ['phone', 'contact:phone', 'contact:mobile', 'mobile']),
    email: first(tags, ['email', 'contact:email']),
    website,
    social,
    websiteStatus: website ? (isSocialUrl(website) ? 'social_only' : 'has_site') : 'none',
    hoursRaw: first(tags, ['opening_hours']),
    address: buildAddress(tags),
    lat,
    lon,
    chain: Boolean(tags.brand || tags['brand:wikidata'] || tags.wikidata),
    areaLabel,
    tagsSeen: Object.keys(tags).length,
  };
}

/* ---------- main ---------- */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  if (!args.area && !args.bbox) {
    usage();
    return;
  }

  const categories = args.all ? categoryIds() : args.categories;
  if (!categories.length) {
    console.error('Pick at least one category with --categories, or pass --all.');
    process.exit(1);
  }

  const unknown = categories.filter((c) => !CATEGORIES[c]);
  if (unknown.length) {
    console.error(`Unknown categories: ${unknown.join(', ')}`);
    process.exit(1);
  }

  let bbox;
  let areaLabel;

  if (args.bbox) {
    bbox = args.bbox.split(',').map((n) => Number(n.trim()));
    if (bbox.length !== 4 || bbox.some((n) => Number.isNaN(n))) {
      console.error('--bbox needs four numbers: south,west,north,east');
      process.exit(1);
    }
    areaLabel = args.area || `bbox ${bbox.join(',')}`;
  } else {
    console.log(`Geocoding "${args.area}"...`);
    const place = await geocode(args.area);
    bbox = place.bbox;
    areaLabel = place.label;
    console.log(`  ${place.label}`);
    console.log(`  bbox ${bbox.join(', ')}`);
  }

  const query = buildQuery(bbox, categories, args.limit);
  console.log(`\nQuerying Overpass for ${categories.length} categories (limit ${args.limit})...`);
  const { payload, endpoint } = await overpass(query);
  console.log(`  ${payload.elements.length} elements from ${endpoint}`);

  const leads = [];
  const skipped = { unnamed: 0, hasSite: 0 };

  for (const element of payload.elements) {
    const lead = toLead(element, areaLabel);
    if (!lead) {
      skipped.unnamed += 1;
      continue;
    }
    if (!args.includeAll && lead.websiteStatus === 'has_site') {
      skipped.hasSite += 1;
      continue;
    }
    leads.push(lead);
  }

  const slug =
    args.out ||
    `${(args.area || 'bbox').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${categories.length === 1 ? categories[0] : 'mixed'}`;

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const file = path.join(RAW_DIR, `${slug}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        slug,
        areaLabel,
        bbox,
        categories,
        fetchedAt: new Date().toISOString(),
        endpoint,
        counts: { elements: payload.elements.length, kept: leads.length, ...skipped },
        leads,
      },
      null,
      2
    )
  );

  const byStatus = leads.reduce((acc, l) => {
    acc[l.websiteStatus] = (acc[l.websiteStatus] || 0) + 1;
    return acc;
  }, {});

  console.log(`\nKept ${leads.length} leads`);
  console.log(`  no website at all : ${byStatus.none || 0}`);
  console.log(`  social page only  : ${byStatus.social_only || 0}`);
  console.log(`  with a phone      : ${leads.filter((l) => l.phone).length}`);
  console.log(`  skipped           : ${skipped.hasSite} already had a site, ${skipped.unnamed} unnamed`);
  console.log(`\nwrote ${path.relative(ROOT, file)}`);
  console.log('Next: node tools/pool.mjs');
}

main().catch((error) => {
  console.error(`harvest failed: ${error.message}`);
  process.exit(1);
});
