#!/usr/bin/env node
// Contact-page enricher. Fetches the website or social page a lead already has and pulls the
// email addresses and phone numbers off it, so leads that OpenStreetMap left blank can still be
// called or mailed.
//
//   node tools/enrich.mjs                     enrich every lead that has a page and no email
//   node tools/enrich.mjs --limit 25          stop after 25 pages
//   node tools/enrich.mjs --refresh           re-check leads that already have an email
//   node tools/enrich.mjs --dry-run           show what would be fetched, fetch nothing
//
// Writes leads/enriched/leads.json, which `node tools/pool.mjs` merges on the next run.
//
// Rules that keep the data trustworthy:
//  - An email or phone already on the lead (from OpenStreetMap, or typed in by hand) is never
//    overwritten. Scraped values only fill gaps and are echoed back in `emails`/`phoneSource`.
//  - robots.txt is respected per host, requests to the same host are serialised, and every page
//    is cached in leads/.enrichcache.json so a second run costs nothing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEAD_DIR = path.join(ROOT, 'leads');
const RAW_DIR = path.join(LEAD_DIR, 'raw');
const ENRICH_DIR = path.join(LEAD_DIR, 'enriched');
const ENRICH_JSON = path.join(ENRICH_DIR, 'leads.json');
const POOL_JSON = path.join(ROOT, 'pool', 'leads.json');
const CACHE_FILE = path.join(LEAD_DIR, '.enrichcache.json');
const UA = 'SiteForge-contact-finder/1.0 (local business website prospecting)';

/* ---------- args ---------- */

function parseArgs(argv) {
  const out = { limit: 200, concurrency: 4, delay: 700, timeout: 10000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--limit') out.limit = Number(next());
    else if (arg === '--concurrency') out.concurrency = Number(next());
    else if (arg === '--delay') out.delay = Number(next());
    else if (arg === '--timeout') out.timeout = Number(next());
    else if (arg === '--out') out.out = next();
    else if (arg === '--refresh') out.refresh = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--ignore-robots') out.ignoreRobots = true;
    else if (arg === '--raw-only') out.rawOnly = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function usage() {
  console.log(`Usage: node tools/enrich.mjs [options]

Options:
  --limit <n>          max pages to fetch this run (default 200)
  --concurrency <n>    pages in flight across different hosts (default 4)
  --delay <ms>         pause between two requests to the same host (default 700)
  --timeout <ms>       per-request timeout (default 10000)
  --refresh            also re-check leads that already have an email
  --raw-only           read harvests only, not the pooled leads
  --ignore-robots      fetch anyway when robots.txt says no (rude, use for one-offs)
  --dry-run            list the pages that would be fetched, then stop
  --out <file>         output file (default leads/enriched/leads.json)

Reads:  pool/leads.json and leads/raw/*.json
Writes: leads/enriched/leads.json  (then run: node tools/pool.mjs)`);
}

/* ---------- small helpers ---------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MULTI_TLD = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'co.nz', 'com.au', 'net.au', 'org.au',
  'co.za', 'com.br', 'com.mx', 'co.jp', 'com.sg', 'co.in', 'com.tr', 'co.il', 'com.hk',
  'co.kr', 'com.tw', 'com.ar', 'com.co', 'com.ph', 'co.id',
]);

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

function registrableDomain(host) {
  const parts = String(host || '').toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_TLD.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

function normaliseUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(text)) return `https://${text}`;
  return '';
}

/* ---------- extraction ---------- */

const EMAIL_RE = /[a-z0-9._%+'-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}/gi;
const BAD_EMAIL_FILE = /\.(png|jpe?g|gif|webp|svg|ico|css|js|mjs|json|xml|woff2?|ttf|eot|mp4|webm|avif|bmp|pdf|zip|webmanifest)$/i;
const BAD_EMAIL_DOMAIN = [
  'sentry.io', 'sentry.wixpress.com', 'wixpress.com', 'example.com', 'example.org', 'example.net',
  'domain.com', 'yourdomain.com', 'your-domain.com', 'email.com', 'godaddy.com', 'squarespace.com',
  'wix.com', 'shopify.com', 'wordpress.com', 'wordpress.org', 'schema.org', 'w3.org',
];
const GENERIC_LOCAL = ['info', 'contact', 'hello', 'enquiries', 'enquiry', 'admin', 'office', 'sales', 'bookings', 'reception', 'mail'];
const GENERIC_RE = new RegExp(`^(${GENERIC_LOCAL.join('|')})[._-]?\\d*$`);

function decodeEntities(text) {
  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&commat;/gi, '@')
    .replace(/&period;|&dot;/gi, '.')
    .replace(/&amp;/gi, '&')
    .replace(/\s*[([{]\s*at\s*[)\]}]/gi, '@')
    .replace(/\s*[([{]\s*dot\s*[)\]}]/gi, '.');
}

function isEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 64) return false;
  if (BAD_EMAIL_FILE.test(email)) return false;
  const [local, domain = ''] = email.split('@');
  if (!local || !domain || !domain.includes('.')) return false;
  if (BAD_EMAIL_DOMAIN.some((bad) => domain === bad || domain.endsWith(`.${bad}`))) return false;
  if (/^[0-9a-f]{16,}$/.test(local)) return false;
  if (/^(u00|%|&)/.test(local)) return false;
  return true;
}

function extractEmails(html, pageUrl) {
  const text = decodeEntities(html);
  const found = new Map();

  const mailtos = text.match(/mailto:[^"'>\s?]+/gi) || [];
  const matches = [...mailtos.map((m) => m.slice(7)), ...(text.match(EMAIL_RE) || [])];

  for (const raw of matches) {
    const email = decodeURIComponent(String(raw)).trim().toLowerCase().replace(/[.,;:'"]+$/, '');
    if (!isEmail(email)) continue;
    const viaMailto = mailtos.some((m) => m.toLowerCase().includes(email));
    const existing = found.get(email) || { email, mailto: false };
    found.set(email, { email, mailto: existing.mailto || viaMailto });
  }

  const site = registrableDomain(hostOf(pageUrl));

  return [...found.values()]
    .map((entry) => {
      const [local, domain] = entry.email.split('@');
      const generic = GENERIC_RE.test(local);
      let points = 0;
      if (site && registrableDomain(domain) === site) points += 100;
      if (entry.mailto) points += 20;
      if (generic) points += 10;
      return { ...entry, points, sameDomain: Boolean(site && registrableDomain(domain) === site), generic };
    })
    .sort((a, b) => b.points - a.points || a.email.length - b.email.length || a.email.localeCompare(b.email))
    .slice(0, 5);
}

// Phone numbers come only from tel: links. Free-text number hunting matches opening hours,
// VAT numbers, and prices far too often to be worth the false positives.
function extractPhones(html) {
  const text = decodeEntities(html);
  const found = new Set();

  for (const match of text.matchAll(/href\s*=\s*["']tel:([^"']+)["']/gi)) {
    const raw = decodeURIComponent(match[1]).trim();
    const plus = raw.startsWith('+') ? '+' : '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 9 && digits.length <= 15) found.add(`${plus}${digits}`);
  }

  return [...found];
}

/* ---------- fetching ---------- */

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const cache = loadJson(CACHE_FILE, {});
const robotsCache = new Map();
const hostQueue = new Map();

function schedule(host, task, delay) {
  const tail = hostQueue.get(host) || Promise.resolve();
  const run = tail
    .then(async () => {
      await sleep(delay);
      return task();
    })
    .catch((error) => ({ ok: false, status: 0, error: error.message }));
  hostQueue.set(host, run.then(() => undefined, () => undefined));
  return run;
}

async function request(url, timeout) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(timeout),
  });

  const type = String(response.headers.get('content-type') || '');
  if (!response.ok) return { ok: false, status: response.status, error: `HTTP ${response.status}` };
  if (!/text\/html|text\/plain|application\/xhtml/i.test(type)) return { ok: false, status: response.status, error: `skipped ${type || 'unknown type'}` };

  const body = await response.text();
  return { ok: true, status: response.status, url: response.url || url, body: body.slice(0, 800000) };
}

async function allowedByRobots(url, timeout) {
  const host = hostOf(url);
  if (!host) return true;
  if (robotsCache.has(host)) return robotsCache.get(host);

  let verdict = true;
  try {
    const robotsUrl = new URL('/robots.txt', `https://${host}`).toString();
    const response = await fetch(robotsUrl, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(timeout) });
    if (response.ok) {
      const text = await response.text();
      verdict = robotAllows(text, new URL(url).pathname);
    }
  } catch {
    verdict = true;
  }

  robotsCache.set(host, verdict);
  return verdict;
}

function robotAllows(robotsText, pathName) {
  const lines = String(robotsText).split(/\r?\n/).map((line) => line.replace(/#.*$/, '').trim());
  let applies = false;
  let wildcard = false;
  const disallow = [];

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    if (!rawKey || !rest.length) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      applies = value === '*' || value.toLowerCase().includes('siteforge');
      if (applies && value === '*') wildcard = true;
    } else if (key === 'disallow' && applies) {
      disallow.push(value);
    } else if (key === 'allow' && applies && value.startsWith(pathName)) {
      return true;
    }
  }

  if (!wildcard && !disallow.length) return true;
  return !disallow.some((rule) => rule && (rule === '/' || pathName.startsWith(rule)));
}

async function fetchPage(url, options) {
  if (!options.ignoreRobots && !(await allowedByRobots(url, options.timeout))) {
    return { ok: false, status: 0, error: 'robots.txt disallows' };
  }
  return schedule(hostOf(url), () => request(url, options.timeout), options.delay);
}

// A page that loads is remembered forever; a page that failed is only retried fortnightly, so a
// dead domain does not get re-fetched on every run. --refresh ignores both.
const RETRY_FAILED_AFTER = 14 * 24 * 60 * 60 * 1000;

async function scrape(candidate, options) {
  const cached = cache[candidate];
  if (cached && !options.refresh) {
    const usable = cached.ok || Date.now() - Date.parse(cached.at || 0) < RETRY_FAILED_AFTER;
    if (usable) return cached;
  }

  const result = await fetchPage(candidate, options);
  if (!result.ok) {
    const failure = { ok: false, error: result.error, at: new Date().toISOString() };
    cache[candidate] = failure;
    return failure;
  }

  const parsed = {
    ok: true,
    url: result.url,
    emails: extractEmails(result.body, result.url),
    phones: extractPhones(result.body),
    at: new Date().toISOString(),
  };

  cache[candidate] = parsed;
  return parsed;
}

/* ---------- lead loading ---------- */

function readPool() {
  const pool = loadJson(POOL_JSON, null);
  return pool?.leads || [];
}

function readRaw() {
  if (!fs.existsSync(RAW_DIR)) return [];
  const leads = [];
  for (const file of fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'))) {
    const parsed = loadJson(path.join(RAW_DIR, file), null);
    for (const lead of parsed?.leads || []) leads.push(lead);
  }
  return leads;
}

function mergeSources(pool, raw) {
  const byId = new Map();
  const byName = new Map();
  for (const lead of [...raw, ...pool]) {
    if (!lead?.name) continue;
    const key = `${String(lead.name).toLowerCase()}|${String(lead.city || '').toLowerCase()}`;
    const existing = byId.get(lead.id) || byName.get(key);
    if (existing) continue;
    byId.set(lead.id, lead);
    byName.set(key, lead);
  }
  return [...new Set(byId.values())];
}

function pagesFor(lead) {
  const pages = [normaliseUrl(lead.website)];
  for (const part of String(lead.social || '').split(/\s+/)) {
    pages.push(normaliseUrl(part));
  }
  return [...new Set(pages.filter(Boolean))];
}

/* ---------- main ---------- */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  const pool = args.rawOnly ? [] : readPool();
  const leads = mergeSources(pool, readRaw());

  const targets = leads
    .map((lead) => ({ lead, pages: pagesFor(lead) }))
    .filter(({ lead, pages }) => pages.length && (args.refresh || !lead.email));

  console.log(`leads        : ${leads.length} known, ${targets.length} have a page${args.refresh ? '' : ' and no email'}`);
  console.log(`emails on file: ${leads.filter((l) => l.email).length}, phones on file: ${leads.filter((l) => l.phone).length}`);

  if (args.dryRun) {
    console.log('\nWould fetch:');
    for (const { lead, pages } of targets.slice(0, args.limit)) {
      console.log(`  ${lead.name}${lead.city ? `, ${lead.city}` : ''}`);
      console.log(`       ${pages.join('  ')}`);
    }
    if (targets.length > args.limit) console.log(`  ... and ${targets.length - args.limit} more (raise --limit)`);
    return;
  }

  if (!targets.length) {
    console.log('\nNothing to do. Leads need a website or social page before this can find anything.');
    return;
  }

  const queue = targets.slice(0, args.limit);
  const total = queue.length;
  const results = [];
  let done = 0;
  let pagesChecked = 0;
  let pagesBlocked = 0;

  const worker = async () => {
    while (queue.length) {
      const { lead, pages } = queue.shift();
      let email = '';
      let emailSource = '';
      const emails = [];
      let phone = '';
      let phoneSource = '';

      const errors = [];
      for (const page of pages) {
        const scraped = await scrape(page, args);
        pagesChecked += 1;
        if (!scraped.ok) {
          pagesBlocked += 1;
          if (scraped.error && !errors.includes(scraped.error)) errors.push(scraped.error);
          continue;
        }

        if (!email && scraped.emails.length) {
          email = scraped.emails[0].email;
          emailSource = scraped.url;
        }
        for (const entry of scraped.emails) {
          if (!emails.includes(entry.email)) emails.push(entry.email);
        }
        if (!lead.phone && !phone && scraped.phones.length) {
          phone = scraped.phones[0];
          phoneSource = scraped.url;
        }
        if (email && (lead.phone || phone)) break;
      }

      done += 1;
      const hit = [email && 'email', phone && 'phone'].filter(Boolean).join(' + ');
      const miss = errors.length ? errors[0].slice(0, 40) : 'no address found';
      console.log(`  ${String(done).padStart(3)}/${total}  ${hit ? `found ${hit}`.padEnd(12) : miss.padEnd(12)}  ${lead.name}`);

      if (email || phone) {
        results.push({
          id: lead.id,
          name: lead.name,
          city: lead.city || '',
          region: lead.region || '',
          website: lead.website || '',
          social: lead.social || '',
          websiteStatus: lead.websiteStatus || '',
          ...(email && !lead.email ? { email } : {}),
          ...(emailSource ? { emails, emailSource } : {}),
          ...(phone && !lead.phone ? { phone } : {}),
          ...(phoneSource ? { phoneSource } : {}),
        });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, args.concurrency) }, worker));

  fs.mkdirSync(path.dirname(args.out || ENRICH_JSON), { recursive: true });
  const output = args.out || ENRICH_JSON;
  fs.writeFileSync(output, `${JSON.stringify({ updatedAt: new Date().toISOString(), source: 'enrich', count: results.length, leads: results }, null, 2)}\n`);

  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`);

  const withEmail = results.filter((r) => r.email).length;
  const withPhone = results.filter((r) => r.phone).length;
  console.log(`\nChecked ${pagesChecked} page(s) for ${done} lead(s).`);
  console.log(`  new emails    : ${withEmail}`);
  console.log(`  new phones    : ${withPhone}`);
  console.log(`  unreachable   : ${pagesBlocked} page(s), cached, retried after a fortnight`);
  console.log(`\nwrote ${path.relative(ROOT, output)} (${results.length} enriched leads)`);
  console.log('Next: node tools/pool.mjs');
}

main();
