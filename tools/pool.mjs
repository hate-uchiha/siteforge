#!/usr/bin/env node
// The pool. Merges every raw harvest, every imported CSV, and every enrichment result into one
// deduplicated, scored, status-tracked lead database with a CSV you can open in Google Sheets.
//
//   node tools/pool.mjs                merge everything, rewrite pool/leads.csv
//   node tools/pool.mjs --summary      counts only, do not rewrite
//   node tools/pool.mjs --top 20       print the 20 best untouched leads
//
// Statuses you set in the CSV (or in pool/leads.json) survive re-merges, because each lead is
// keyed by phone number and by name plus town, and new data is merged onto the existing record
// instead of replacing it. That matters most for enrichment: a lead harvested with no phone can
// be matched later by name once a phone number is found.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSocialUrl } from './categories.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEAD_DIR = path.join(ROOT, 'leads');
const RAW_DIR = path.join(LEAD_DIR, 'raw');
const IMPORT_DIR = path.join(LEAD_DIR, 'import');
const ENRICH_DIR = path.join(LEAD_DIR, 'enriched');
const POOL_DIR = path.join(ROOT, 'pool');
const POOL_JSON = path.join(POOL_DIR, 'leads.json');
const POOL_CSV = path.join(POOL_DIR, 'leads.csv');

const STATUSES = ['new', 'demo', 'contacted', 'talking', 'won', 'lost', 'dead'];

const COLUMNS = [
  'id', 'tier', 'score', 'status', 'category', 'name', 'phone', 'phoneSource', 'email', 'emails',
  'emailSource', 'websiteStatus', 'website', 'social', 'city', 'region', 'country', 'address',
  'hoursRaw', 'lat', 'lon', 'chain', 'demoBuilt', 'contactedAt', 'source', 'sourceUrl', 'notes',
];

/* ---------- args ---------- */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--summary') out.summary = true;
    else if (arg === '--top') out.top = Number(next());
    else if (arg === '--min-score') out.minScore = Number(next());
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

/* ---------- csv ---------- */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  if (!header) return [];

  const keys = header.map((h) => String(h).trim().toLowerCase());
  return body.map((cells) => {
    const record = {};
    keys.forEach((key, index) => {
      record[key] = (cells[index] || '').trim();
    });
    return record;
  });
}

function toCsv(rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [COLUMNS.join(','), ...rows.map((row) => COLUMNS.map((c) => escape(row[c])).join(','))].join('\n');
}

/* ---------- normalising ---------- */

const digits = (value) => String(value || '').replace(/\D/g, '');

function phoneKey(phone) {
  const d = digits(phone);
  return d.length >= 7 ? d.slice(-9) : '';
}

function normaliseName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(ltd|limited|llc|inc|plc|the|and|&)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// A lead can be identified two ways, and both indexes are kept because enrichment changes one of
// them: a business harvested without a phone number is only findable by name, and gains a phone
// key later when a number is found on its website.
function phoneKeyOf(lead) {
  const key = phoneKey(lead?.phone);
  return key ? `phone:${key}` : '';
}

function nameKeyOf(lead) {
  const name = normaliseName(lead?.name);
  const town = String(lead?.city || '').toLowerCase().trim();
  return name ? `name:${name}|${town}` : '';
}

// New facts fill gaps, they never blank out a value a previous source already knew. Harvests used
// to be complete records, so a plain overwrite was harmless; enrichment returns partial records,
// and an empty string from one of those must not erase a city or an opening hours string.
const WORKFLOW_FIELDS = new Set(['status', 'notes', 'contactedAt', 'demoBuilt']);

function mergeFact(base, incoming) {
  const out = Object.assign({}, base);
  for (const [key, value] of Object.entries(incoming || {})) {
    if (WORKFLOW_FIELDS.has(key)) continue;
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && !value.length) continue;
    out[key] = value;
  }
  return out;
}

const pick = (record, keys) => {
  for (const key of keys) {
    if (record[key] && String(record[key]).trim()) return String(record[key]).trim();
  }
  return '';
};

function fromRaw(lead) {
  const address = lead.address || {};
  return {
    id: lead.id,
    category: lead.category || '',
    name: lead.name,
    phone: lead.phone || '',
    phoneSource: lead.phoneSource || '',
    email: lead.email || '',
    emails: Array.isArray(lead.emails) ? lead.emails : [],
    emailSource: lead.emailSource || '',
    website: lead.website || '',
    social: lead.social || '',
    websiteStatus: lead.websiteStatus || (lead.website ? 'has_site' : 'none'),
    hoursRaw: lead.hoursRaw || '',
    // Enrichment writes city and region flat, harvests write them nested in address.
    city: lead.city || address.city || '',
    region: lead.region || address.region || '',
    country: lead.country || address.country || '',
    // A CSV import already has a flat address string; a harvest has structured parts.
    address: typeof lead.address === 'string'
      ? lead.address
      : [address.street, address.city, address.region, address.postalCode, address.country].filter(Boolean).join(', '),
    lat: lead.lat || '',
    lon: lead.lon || '',
    chain: Boolean(lead.chain),
    source: lead.source || 'openstreetmap',
    sourceUrl: lead.sourceUrl || '',
  };
}

function fromCsvRow(record) {
  const website = pick(record, ['website', 'site', 'url', 'web']);
  const status = pick(record, ['website status', 'websitestatus']).toLowerCase();

  return {
    id: pick(record, ['id']) || `csv-${Math.random().toString(36).slice(2, 10)}`,
    category: pick(record, ['category', 'trade', 'niche', 'industry']),
    name: pick(record, ['name', 'business', 'business name', 'company']),
    phone: pick(record, ['phone', 'telephone', 'tel', 'mobile', 'number']),
    phoneSource: pick(record, ['phone source', 'phonesource']),
    email: pick(record, ['email', 'e-mail', 'mail']),
    emails: pick(record, ['emails', 'all emails']).split(/\s*[|;]\s*/).filter(Boolean),
    emailSource: pick(record, ['email source', 'emailsource']),
    website,
    social: pick(record, ['social', 'facebook', 'instagram', 'social url']),
    websiteStatus: status || (website ? (isSocialUrl(website) ? 'social_only' : 'has_site') : 'none'),
    hoursRaw: pick(record, ['hours', 'opening hours', 'opening_hours']),
    city: pick(record, ['city', 'town', 'locality']),
    region: pick(record, ['region', 'state', 'county', 'province']),
    country: pick(record, ['country']),
    address: pick(record, ['address', 'full address', 'street']),
    lat: pick(record, ['lat', 'latitude']),
    lon: pick(record, ['lon', 'lng', 'longitude']),
    chain: /^(yes|true|1)$/i.test(pick(record, ['chain'])),
    source: pick(record, ['source']) || 'import',
    sourceUrl: pick(record, ['source url', 'sourceurl', 'listing']),
    status: pick(record, ['status']),
    notes: pick(record, ['notes', 'note', 'comment']),
    contactedAt: pick(record, ['contacted', 'contacted at', 'contactedat', 'last contact']),
    demoBuilt: /^(yes|true|1)$/i.test(pick(record, ['demo built', 'demobuilt', 'demo'])),
  };
}

/* ---------- scoring ---------- */

function score(lead) {
  let total = 0;
  const reasons = [];

  if (lead.phone) {
    total += 30;
    reasons.push('phone +30');
  }
  if (lead.email) {
    total += 12;
    reasons.push('email +12');
  }

  if (lead.websiteStatus === 'none') {
    total += 25;
    reasons.push('no site +25');
  } else if (lead.websiteStatus === 'social_only') {
    total += 15;
    reasons.push('social only +15');
  } else {
    total -= 25;
    reasons.push('has site -25');
  }

  if (lead.hoursRaw) {
    total += 8;
    reasons.push('hours +8');
  }

  const parts = String(lead.address || '').split(',').filter((p) => p.trim());
  if (parts.length >= 3) {
    total += 10;
    reasons.push('full address +10');
  } else if (lead.city) {
    total += 4;
    reasons.push('city +4');
  }

  if (lead.chain) {
    total -= 25;
    reasons.push('chain -25');
  } else {
    total += 8;
    reasons.push('independent +8');
  }

  if (lead.category) {
    total += 5;
    reasons.push('category +5');
  }

  const name = normaliseName(lead.name);
  if (name.length >= 5 && name.includes(' ')) {
    total += 5;
    reasons.push('real name +5');
  }

  if (lead.lat && lead.lon) {
    total += 2;
    reasons.push('geo +2');
  }

  const clamped = Math.max(0, Math.min(100, total));
  return { score: clamped, reasons };
}

const tierFor = (value) => (value >= 70 ? 'A' : value >= 45 ? 'B' : 'C');

/* ---------- gather ---------- */

function readRaw() {
  if (!fs.existsSync(RAW_DIR)) return [];
  const leads = [];
  for (const file of fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
      for (const lead of parsed.leads || []) leads.push(fromRaw(lead));
    } catch (error) {
      console.warn(`  skipped ${file}: ${error.message}`);
    }
  }
  return leads;
}

function readImports() {
  if (!fs.existsSync(IMPORT_DIR)) return [];
  const leads = [];
  for (const file of fs.readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.csv'))) {
    const rows = parseCsv(fs.readFileSync(path.join(IMPORT_DIR, file), 'utf8'));
    for (const row of rows) {
      const lead = fromCsvRow(row);
      if (lead.name) leads.push(lead);
    }
    console.log(`  imported ${rows.length} rows from ${file}`);
  }
  return leads;
}

function readEnriched() {
  if (!fs.existsSync(ENRICH_DIR)) return [];
  const leads = [];
  for (const file of fs.readdirSync(ENRICH_DIR).filter((f) => f.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(ENRICH_DIR, file), 'utf8'));
      for (const lead of parsed.leads || []) leads.push(fromRaw(lead));
    } catch (error) {
      console.warn(`  skipped ${file}: ${error.message}`);
    }
  }
  return leads;
}

function readExisting() {
  try {
    const parsed = JSON.parse(fs.readFileSync(POOL_JSON, 'utf8'));
    return parsed.leads || [];
  } catch {
    return [];
  }
}

/* ---------- main ---------- */

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node tools/pool.mjs [--summary] [--top N] [--min-score N]');
    return;
  }

  const existing = readExisting();
  const incoming = readRaw();
  const imported = readImports();
  const enriched = readEnriched();

  const byPhone = new Map();
  const byName = new Map();
  const records = [];

  const index = (record) => {
    const phone = phoneKeyOf(record);
    if (phone && !byPhone.has(phone)) byPhone.set(phone, record);
    const name = nameKeyOf(record);
    if (name && !byName.has(name)) byName.set(name, record);
  };

  for (const lead of existing) {
    records.push(lead);
    index(lead);
  }

  for (const lead of [...incoming, ...imported, ...enriched]) {
    const phone = phoneKeyOf(lead);
    const name = nameKeyOf(lead);
    const match = (phone && byPhone.get(phone)) || (name && byName.get(name)) || null;

    // Incoming data wins on facts, the existing record wins on workflow state.
    const record = mergeFact(match || {}, lead);
    record.status = lead.status || match?.status || 'new';
    record.notes = lead.notes || match?.notes || '';
    record.contactedAt = lead.contactedAt || match?.contactedAt || '';
    record.demoBuilt = Boolean(lead.demoBuilt || match?.demoBuilt);
    record.id = match?.id || lead.id;

    if (match) {
      // Merge in place so every index entry already pointing at this record stays valid.
      Object.assign(match, record);
      index(match);
    } else {
      records.push(record);
      index(record);
    }
  }

  const leads = [];
  for (const lead of records) {
    if (!lead.name) continue;
    const { score: value, reasons } = score(lead);
    leads.push(Object.assign({}, lead, { score: value, tier: tierFor(value), why: reasons.join(' | ') }));
  }

  leads.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));

  if (args.minScore) {
    const filtered = leads.filter((l) => l.score >= args.minScore);
    console.log(`min score ${args.minScore}: ${filtered.length} of ${leads.length} leads`);
  }

  const open = leads.filter((l) => l.status === 'new' || l.status === 'demo');

  if (args.summary) {
    report(leads, incoming.length, imported.length, enriched.length);
    return;
  }

  fs.mkdirSync(POOL_DIR, { recursive: true });
  fs.writeFileSync(POOL_JSON, JSON.stringify({ updatedAt: new Date().toISOString(), leads }, null, 2));
  fs.writeFileSync(
    POOL_CSV,
    toCsv(leads.map((lead) => Object.assign({}, lead, {
      emails: (lead.emails || []).join(' | '),
    })))
  );

  report(leads, incoming.length, imported.length, enriched.length);
  console.log(`\nwrote ${path.relative(ROOT, POOL_CSV)} and ${path.relative(ROOT, POOL_JSON)}`);

  if (args.top) {
    console.log(`\nTop ${args.top} untouched leads:\n`);
    for (const lead of open.slice(0, args.top)) {
      console.log(`  ${String(lead.score).padStart(3)} ${lead.tier}  ${String(lead.category || '-').padEnd(13)} ${lead.name}`);
      console.log(`       ${lead.phone || 'no phone'}  ${lead.email || 'no email'}  ${lead.city || ''}  [${lead.websiteStatus}]`);
    }
  }
}

function report(leads, rawCount, importedCount, enrichedCount = 0) {
  const byTier = (t) => leads.filter((l) => l.tier === t).length;
  const byStatus = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const byCategory = leads.reduce((acc, l) => {
    if (l.category) acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});

  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const withPhone = leads.filter((l) => l.phone).length;
  const withEmail = leads.filter((l) => l.email).length;
  const withBoth = leads.filter((l) => l.phone && l.email).length;
  const unreachable = leads.filter((l) => !l.phone && !l.email).length;

  console.log(`\nPool: ${leads.length} unique leads`);
  console.log(`  sources   : ${rawCount} harvested, ${importedCount} imported, ${enrichedCount} enriched`);
  console.log(`  tiers     : A ${byTier('A')} (70+), B ${byTier('B')} (45-69), C ${byTier('C')} (<45)`);
  console.log(`  no site   : ${leads.filter((l) => l.websiteStatus === 'none').length}`);
  console.log(`  social    : ${leads.filter((l) => l.websiteStatus === 'social_only').length}`);
  console.log(`  contact   : ${withPhone} phone, ${withEmail} email, ${withBoth} both, ${unreachable} neither`);
  console.log(`  status    : ${STATUSES.map((s) => `${s} ${byStatus[s] || 0}`).join(', ')}`);
  if (top.length) console.log(`  trades    : ${top.map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

main();
