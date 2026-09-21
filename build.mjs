#!/usr/bin/env node
// SiteForge build script. Zero dependencies.
// Usage:
//   node build.mjs                 build every client in clients/
//   node build.mjs <slug>          build one client
//   node build.mjs --list          list available niches and clients

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { presets, getPreset, nicheList } from './presets/index.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(ROOT, 'clients');
const OUT_DIR = path.join(ROOT, 'sites');
const ASSET_DIR = path.join(ROOT, 'assets');

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

const DEFAULT_HOURS = {
  mon: '08:00 to 18:00',
  tue: '08:00 to 18:00',
  wed: '08:00 to 18:00',
  thu: '08:00 to 18:00',
  fri: '08:00 to 18:00',
  sat: '09:00 to 14:00',
  sun: 'Closed',
};

const FONT_PAIRINGS = {
  modern: { head: "'Plus Jakarta Sans'", body: "'Inter'", google: 'Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700' },
  bold: { head: "'Archivo'", body: "'Inter'", google: 'Archivo:wght@700;800;900&family=Inter:wght@400;500;600;700' },
  warm: { head: "'Fraunces'", body: "'Inter'", google: 'Fraunces:wght@700;800&family=Inter:wght@400;500;600;700' },
  clean: { head: "'Manrope'", body: "'Manrope'", google: 'Manrope:wght@400;500;600;700;800' },
};

const STROKE_ICONS = {
  check: '<polyline points="20 6 9 17 4 12"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
  droplet: '<path d="M12 2.7 6.7 8a7 7 0 1 0 10.6 0z"/>',
  flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-1.5 2.5-3 3-3 5.5 0 1.5-1 2-1.5 1.5C10 11 9 9.5 9 8c-1.5 2-2 4-2 7a7 7 0 0 0 5 7z"/>',
  wrench: '<path d="M15.5 7.5a4.5 4.5 0 1 0 5 5L21 21H3l9.5-9.5a4.5 4.5 0 1 1 3-4z"/>',
  sparkle: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  brush: '<path d="M3 21s1-3 4-3 3-2 3-2"/><path d="m14 10 6-6a2 2 0 0 0-3-3l-6 6"/><path d="m8 14 6-6 3 3-6 6z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  razor: '<path d="M4 4h16v4a4 4 0 0 1-4 4H9l-5 8"/><path d="M9 12h11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  dumbbell: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  heart: '<path d="M12 21C7 17 2 13.6 2 9.5A4.5 4.5 0 0 1 6.5 5c1.8 0 3.5 1 4.5 2.7A5 5 0 0 1 16 5a4.5 4.5 0 0 1 4.5 4.5c0 4.1-5 7.5-8.5 11.5z"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  truck: '<path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  leaf: '<path d="M4 20c0-9 6-15 16-16 0 11-6 16-13 16H4z"/><path d="M4 20c3-5 7-8 11-9"/>',
  snowflake: '<path d="M12 2v20M4 6l16 12M20 6 4 18M2 12h20"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 11h6M9 15h4"/>',
  calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
  book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h5z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M17 4l3 3M15 6l2 2"/>',
  car: '<path d="M5 17h14M6 17V9l2-3h8l2 3v8"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
  paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="17" cy="9" r="2"/><path d="M12 12c3 0 5 2.5 5 5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0c0-2.5 2-5 5-5z"/>',
  utensils: '<path d="M5 3v7a2 2 0 0 0 4 0V3M7 12v9M15 3c0 3 1 4 1 6a3 3 0 0 1-2 3v9"/>',
  wine: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0z"/><path d="M12 13v6M9 21h6"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  rug: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 6v12M17 6v12"/>',
  pipe: '<path d="M3 9h9a4 4 0 0 1 4 4v8"/><path d="M3 6v6M16 21h5v-5"/>',
  cable: '<path d="M4 4v7a4 4 0 0 0 4 4h8a4 4 0 0 1 4 4v1"/><path d="M2 4h4M18 20h4"/>',
  ev: '<rect x="5" y="3" width="14" height="12" rx="2"/><path d="m12 6-2 4h4l-2 4M9 21h6M12 15v6"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3 11v4h6v-4a6 6 0 0 0-3-11z"/>',
  shower: '<path d="M4 12h16"/><path d="M7 12V6a3 3 0 0 1 6 0"/><path d="M9 16h.01M13 16h.01M11 20h.01M15 20h.01"/>',
  grass: '<path d="M4 20c0-6 2-10 5-12M12 20c0-7 3-12 8-14M8 20c0-4 1-7 3-9"/>',
  tree: '<path d="M12 3 6 12h4l-3 5h10l-3-5h4z"/><path d="M12 17v4"/>',
  fence: '<path d="M6 3v18M12 3v18M18 3v18M4 8h16M4 14h16"/>',
  apple: '<path d="M12 7c-4 0-6 3-6 6a6 6 0 0 0 6 6c4 0 6-3 6-6a6 6 0 0 0-6-6z"/><path d="M12 7c0-2 1-4 3-4"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  tooth: '<path d="M12 4c-4 0-6 2-6 6 0 5 2 10 3 10s1-3 3-3 2 3 3 3 3-5 3-10c0-4-2-6-6-6z"/>',
  flower: '<circle cx="12" cy="9" r="3"/><path d="M12 6c0-2 2-3 3-2s0 3-1 4M15 12c2-1 3 1 2 2s-3 0-4-1M9 12c-2-1-3 1-2 2s3 0 4-1M12 12v9"/>',
  file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h4"/>',
};

const FILL_ICONS = {
  star: '<polygon points="12 2 15.1 8.6 22 9.5 17 14.3 18.2 21.2 12 18.1 5.8 21.2 7 14.3 2 9.5 8.9 8.6"/>',
};

const ICON_ALIASES = {
  cut: 'scissors',
  razor: 'razor',
  rug: 'rug',
  cleaning: 'sparkle',
  plumbing: 'pipe',
};

function icon(name, extraClass) {
  const key = ICON_ALIASES[name] || name;
  const filled = FILL_ICONS[key];
  const cls = extraClass ? ` class="${extraClass}"` : '';

  if (filled) {
    return `<svg${cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${filled}</svg>`;
  }

  const body = STROKE_ICONS[key] || STROKE_ICONS.check;
  return `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ---------- small helpers ---------- */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initials(name) {
  const parts = String(name)
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'SF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function readableOn(hex) {
  return luminance(hex) > 0.45 ? '#101827' : '#ffffff';
}

function mix(hex, weight, other) {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  const w = Math.max(0, Math.min(1, weight));
  const to = (x, y) => Math.round(x * (1 - w) + y * w);
  const s = (v) => v.toString(16).padStart(2, '0');
  return `#${s(to(a.r, b.r))}${s(to(a.g, b.g))}${s(to(a.b, b.b))}`;
}

function telHref(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

function waHref(number, businessName) {
  const digits = String(number || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(`Hi ${businessName}, I would like a quote please.`);
  return `https://wa.me/${digits}?text=${text}`;
}

/* ---------- config ---------- */

export function mergeConfig(raw) {
  const presetId = raw.preset || raw.niche;
  const preset = getPreset(presetId);
  const biz = raw.business || {};

  const name = biz.name || 'Your Business Name';
  const slug = raw.slug || slugify(name);

  const hours = Object.assign({}, DEFAULT_HOURS, biz.hours || {});

  const cfg = {
    slug,
    demo: raw.demo !== false,
    notice: raw.notice || 'Design preview. Sample content and placeholder images are shown until final details are supplied.',
    presetId,
    preset,
    brand: Object.assign(
      { primary: preset.brand.primary, accent: preset.brand.accent, ink: preset.brand.ink, font: 'modern' },
      raw.brand || {}
    ),
    business: Object.assign(
      {
        name,
        tagline: preset.label,
        phone: '',
        whatsapp: '',
        email: '',
        founded: '',
        licence: '',
        emergency: Boolean(preset.emergency),
        rating: null,
        social: {},
        areas: [],
        hours,
        address: {},
        geo: null,
        mapEmbedUrl: '',
        formEndpoint: '',
        domain: '',
      },
      biz
    ),
    hero: Object.assign({}, preset.hero, raw.hero || {}),
    ctas: Object.assign({}, preset.ctas, raw.ctas || {}),
    trust: raw.trust || preset.trust,
    stats: raw.stats || preset.stats,
    statsFromClient: Array.isArray(raw.stats) && raw.stats.length > 0,
    services: raw.services || preset.services,
    gallery: raw.gallery || preset.galleryLabels.map((label) => ({ label })),
    faq: raw.faq || preset.faq,
    testimonials: raw.testimonials || [],
    why: raw.why || [],
    primaryService: raw.primaryService || (raw.services || preset.services)[0].name,
  };

  cfg.business.hours = hours;
  cfg.business.areas = cfg.business.areas.length ? cfg.business.areas : ['your town', 'your county'];
  return cfg;
}

/* ---------- derived values ---------- */

function addressLine(cfg) {
  const a = cfg.business.address || {};
  return [a.street, a.city, a.region, a.postalCode, a.country].filter(Boolean).join(', ');
}

function mapSrc(cfg) {
  if (cfg.business.mapEmbedUrl) return cfg.business.mapEmbedUrl;
  const query = addressLine(cfg) || cfg.business.name;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function siteUrl(cfg) {
  if (cfg.business.domain) return `https://${cfg.business.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return '';
}

const LOCALES = { GB: 'en_GB', US: 'en_US', CA: 'en_CA', AU: 'en_AU', IE: 'en_IE', NZ: 'en_NZ', ZA: 'en_ZA' };

function locale(cfg) {
  const country = String((cfg.business.address || {}).country || '').toUpperCase();
  return LOCALES[country] || 'en';
}

function serviceIcons(cfg) {
  return cfg.services.map((s, i) => ({ icon: s.icon || ['check', 'shield', 'clock'][i % 3] }));
}

// Kept separate from the trust strip on purpose, so the page does not repeat itself.
function defaultWhy(cfg) {
  return [
    {
      title: 'A written price before we start',
      body: 'You see the number first, in writing. Nothing changes unless you approve it, and there are no extras added at the end.',
      icon: 'file',
    },
    {
      title: 'The same team, start to finish',
      body: `${cfg.business.name} is a local team, not a call centre. Whoever quotes the work is the person you can hold accountable for it.`,
      icon: 'users',
    },
    {
      title: 'Work we stand behind',
      body: 'The job is checked before we leave and the guarantee is in writing, so you know exactly where to come if anything needs putting right.',
      icon: 'shield',
    },
    {
      title: 'Local, so you can reach us',
      body: 'We answer our own phone. No ticket numbers, no call queues, and no waiting three days for a reply.',
      icon: 'mapPin',
    },
  ];
}

function jsonLd(cfg) {
  const biz = cfg.business;
  const type = cfg.preset.schemaType;
  const url = siteUrl(cfg);
  const a = biz.address || {};

  const data = {
    '@context': 'https://schema.org',
    '@type': type,
    name: biz.name,
    description: cfg.hero.sub,
    telephone: biz.phone || undefined,
    email: biz.email || undefined,
    url: url || undefined,
    address: addressLine(cfg)
      ? {
          '@type': 'PostalAddress',
          streetAddress: a.street || undefined,
          addressLocality: a.city || undefined,
          addressRegion: a.region || undefined,
          postalCode: a.postalCode || undefined,
          addressCountry: a.country || undefined,
        }
      : undefined,
    geo:
      biz.geo && biz.geo.lat
        ? { '@type': 'GeoCoordinates', latitude: biz.geo.lat, longitude: biz.geo.lng }
        : undefined,
    areaServed: biz.areas.map((area) => ({ '@type': 'City', name: area })),
    openingHoursSpecification: DAYS.filter(([key]) => /to/i.test(biz.hours[key] || '')).map(([key, label]) => {
      const [open, close] = String(biz.hours[key]).split(/\s+to\s+/i);
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${label}`,
        opens: open.trim(),
        closes: (close || '').trim(),
      };
    }),
    priceRange: '$$',
    sameAs: Object.values(biz.social || {}).filter(Boolean),
  };

  // Google penalises invented review data, so ratings only go live on a real (non demo) build.
  if (!cfg.demo && biz.rating && biz.rating.value) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: biz.rating.value,
      reviewCount: biz.rating.count,
    };
  }

  const blocks = [data];

  if (cfg.faq && cfg.faq.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: cfg.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  // One ld+json block must contain exactly one JSON document, so multiple schema
  // blocks are emitted as an array rather than concatenated objects.
  const payload = blocks.length === 1 ? blocks[0] : blocks;
  return JSON.stringify(payload, (k, v) => (v === undefined ? undefined : v), 2);
}

/* ---------- sections ---------- */

function header(cfg) {
  const biz = cfg.business;
  const links = [
    ['#services', 'Services'],
    ['#why', 'Why us'],
    ['#reviews', cfg.testimonials.length ? 'Reviews' : null],
    ['#areas', 'Areas'],
    ['#faq', 'FAQs'],
  ].filter((l) => l[1]);

  return `
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="#top">
        <span class="brand-mark" aria-hidden="true">${esc(initials(biz.name))}</span>
        <span>
          <span class="brand-name">${esc(biz.name)}</span>
          <span class="brand-sub">${esc(biz.tagline)}</span>
        </span>
      </a>
      <nav class="nav" id="nav" aria-label="Main">
        ${links.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('\n        ')}
      </nav>
      <div class="header-cta">
        ${biz.phone ? `<a class="header-tel" href="${telHref(biz.phone)}">${icon('phone')}<span>${esc(biz.phone)}</span></a>` : ''}
        <a class="btn btn-primary" href="#quote">${esc(cfg.ctas.primary)}</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

function heroForm(cfg) {
  const biz = cfg.business;
  return `
        <form class="quote-form" data-endpoint="${esc(biz.formEndpoint)}" data-demo="${cfg.demo}" novalidate>
          <h3>Get a free quote</h3>
          <p class="card-note">Takes under a minute. No obligation, no sales calls at 9pm.</p>
          <div class="field">
            <label for="hero-name">Name</label>
            <input id="hero-name" name="name" type="text" autocomplete="name" required placeholder="Your name">
          </div>
          <div class="field">
            <label for="hero-phone">Phone</label>
            <input id="hero-phone" name="phone" type="tel" autocomplete="tel" required placeholder="Best number to reach you">
          </div>
          <div class="field">
            <label for="hero-service">What do you need?</label>
            <select id="hero-service" name="service">
              ${cfg.services.map((s) => `<option>${esc(s.name)}</option>`).join('\n              ')}
              <option>Something else</option>
            </select>
          </div>
          <button class="btn btn-primary btn-block" type="submit">${esc(cfg.ctas.primary)}</button>
          <p class="form-status" role="status" aria-live="polite"></p>
          <p class="form-note">By sending this you agree to be contacted about your enquiry. We never sell your details.</p>
        </form>`;
}

function hero(cfg) {
  const biz = cfg.business;
  return `
    <section class="hero" id="top">
      <div class="wrap hero-grid">
        <div>
          <span class="eyebrow">${esc(cfg.hero.eyebrow)}</span>
          <h1>${esc(cfg.hero.headline)}</h1>
          <p class="hero-sub">${esc(cfg.hero.sub)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="#quote">${esc(cfg.ctas.primary)}</a>
            ${biz.phone ? `<a class="btn btn-ghost" href="${telHref(biz.phone)}">${icon('phone')}<span>${esc(biz.phone)}</span></a>` : ''}
          </div>
          <ul class="hero-points">
            ${cfg.trust.slice(0, 4).map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n            ')}
          </ul>
        </div>
        <div class="hero-card">
          ${heroForm(cfg)}
        </div>
      </div>
    </section>`;
}

function trustStrip(cfg) {
  return `
    <div class="trust">
      <div class="wrap">
        <ul class="trust-list">
          ${cfg.trust.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </div>`;
}

// Niches that sell from a fixed price list rather than a written quote per job.
const MENU_NICHES = new Set(['barber', 'salon', 'restaurant', 'gym', 'dentist', 'tutor', 'petgrooming']);

function servicesIntro(cfg) {
  if (cfg.preset.servicesIntro) return cfg.preset.servicesIntro;
  if (MENU_NICHES.has(cfg.presetId)) {
    return 'Prices are on the board and nothing is added at the till. Ask us anything before you book.';
  }
  return 'Every job below is quoted in writing before we start. If it turns out to be something else, we tell you before touching anything.';
}

function services(cfg) {
  return `
    <section class="section" id="services">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">What we do</span>
          <h2>${esc(cfg.preset.label)} done properly</h2>
          <p>${esc(servicesIntro(cfg))}</p>
        </div>
        <div class="grid grid-3">
          ${cfg.services
            .map(
              (s) => `<article class="card reveal">
            <div class="card-icon">${icon(s.icon)}</div>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.description)}</p>
          </article>`
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`;
}

/* The preset figures are illustrative samples, written to show the layout. They
   are safe on a demo, which is noindex and labelled, but a live site must not
   assert a trading history, a job count, or a rating the business never gave us.
   So a live build renders figures only when the client file supplies them. */
function buildStats(cfg) {
  return cfg.demo || cfg.statsFromClient ? cfg.stats : [];
}

function why(cfg) {
  const points = cfg.why.length ? cfg.why : defaultWhy(cfg);
  const stats = buildStats(cfg);
  return `
    <section class="section section-alt" id="why">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Why ${esc(cfg.business.name)}</span>
          <h2>Reasons customers stay with us</h2>
          <p>We are a local team, not a call centre. That means straight answers, sensible prices, and someone accountable if anything needs putting right.</p>
        </div>
        ${stats.length
          ? `<div class="stats reveal" style="margin-bottom:2rem">
          ${stats
            .map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`)
            .join('\n          ')}
        </div>`
          : ''}
        <div class="grid grid-2">
          ${points
            .slice(0, 4)
            .map(
              (p) => `<article class="card reveal">
            <div class="card-icon">${icon(p.icon)}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.body)}</p>
          </article>`
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`;
}

function gallery(cfg) {
  if (!cfg.gallery.length) return '';
  return `
    <section class="section" id="work">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Our work</span>
          <h2>Recent jobs</h2>
          <p>Replace these tiles with your own photographs. Real photos of real jobs convert better than stock every time.</p>
        </div>
        <div class="gallery reveal">
          ${cfg.gallery
            .map((g) => {
              const label = typeof g === 'string' ? g : g.label;
              const image = typeof g === 'string' ? '' : g.image;
              return `<button class="shot" type="button" aria-label="${esc(label)}">${image ? `<img src="${esc(image)}" alt="${esc(label)}" loading="lazy">` : ''}<span>${esc(label)}</span></button>`;
            })
            .join('\n          ')}
        </div>
      </div>
    </section>`;
}

function testimonials(cfg) {
  if (!cfg.testimonials.length) return '';
  const rating = cfg.business.rating || { value: '', count: '' };
  return `
    <section class="section section-alt" id="reviews">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Reviews</span>
          <h2>What customers say</h2>
          ${
            rating.count
              ? `<p>Rated ${esc(rating.value)} out of 5 from ${esc(rating.count)} reviews.</p>`
              : '<p>The reviews below are samples. Swap them for real quotes once the site goes live.</p>'
          }
        </div>
        <div class="grid grid-3">
          ${cfg.testimonials
            .map(
              (t) => `<article class="quote reveal">
            <div class="stars" aria-label="5 out of 5">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div>
            <p>${esc(t.text)}</p>
            <footer>${esc(t.name)}${t.location ? `, ${esc(t.location)}` : ''}</footer>
          </article>`
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`;
}

function areas(cfg) {
  const list = cfg.business.areas;
  if (!list.length) return '';
  return `
    <section class="section" id="areas">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Where we work</span>
          <h2>Areas we cover</h2>
          <p>Based in ${esc(cfg.business.address.city || list[0])} and covering the surrounding area. Outside the list? Ask anyway, we often travel further.</p>
        </div>
        <ul class="areas reveal">
          ${list.map((area) => `<li>${icon('mapPin')}<span>${esc(area)}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>`;
}

function faqSection(cfg) {
  if (!cfg.faq.length) return '';
  return `
    <section class="section section-alt" id="faq">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Questions</span>
          <h2>Frequently asked</h2>
        </div>
        <div class="faq-list">
          ${cfg.faq
            .map(
              (item) => `<details class="qa reveal">
            <summary>${esc(item.q)}</summary>
            <div class="qa-body"><p>${esc(item.a)}</p></div>
          </details>`
            )
            .join('\n          ')}
        </div>
      </div>
    </section>`;
}

function band(cfg) {
  const biz = cfg.business;
  return `
    <section class="section">
      <div class="wrap">
        <div class="band reveal">
          <div>
            <h2>Need it sorted this week?</h2>
            <p>${biz.emergency ? 'Emergency calls take priority. Ring us and we will tell you honestly when we can get there.' : 'Tell us what you need and we will send a written price, usually the same day.'}</p>
          </div>
          <div class="hero-cta" style="margin:0">
            ${biz.phone ? `<a class="btn btn-accent" href="${telHref(biz.phone)}">${icon('phone')}<span>${esc(biz.phone)}</span></a>` : ''}
            <a class="btn btn-white" href="#quote">${esc(cfg.ctas.primary)}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function contact(cfg) {
  const biz = cfg.business;
  const social = Object.entries(biz.social || {}).filter(([, v]) => v);

  return `
    <section class="section section-alt" id="quote">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="kicker">Get in touch</span>
          <h2>Request a quote</h2>
          <p>Fill this in or call us. Either way you get a straight answer, not a sales pitch.</p>
        </div>
        <div class="contact-grid">
          <form class="quote-form" data-endpoint="${esc(biz.formEndpoint)}" data-demo="${cfg.demo}" novalidate>
            <div class="field-row">
              <div class="field">
                <label for="name">Name</label>
                <input id="name" name="name" type="text" autocomplete="name" required placeholder="Your name">
              </div>
              <div class="field">
                <label for="phone">Phone</label>
                <input id="phone" name="phone" type="tel" autocomplete="tel" required placeholder="Best number to reach you">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com">
              </div>
              <div class="field">
                <label for="service">Service</label>
                <select id="service" name="service">
                  ${cfg.services.map((s) => `<option>${esc(s.name)}</option>`).join('\n                  ')}
                  <option>Something else</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="message">What needs doing?</label>
              <textarea id="message" name="message" placeholder="A sentence or two is plenty"></textarea>
            </div>
            <button class="btn btn-primary btn-block" type="submit">Send my request</button>
            <p class="form-status" role="status" aria-live="polite"></p>
            <p class="form-note">We reply to every enquiry, usually within one working day.</p>
          </form>

          <div class="info-block">
            ${biz.phone ? `<div class="info-item">${icon('phone')}<div><b>Phone</b><a href="${telHref(biz.phone)}">${esc(biz.phone)}</a></div></div>` : ''}
            ${biz.whatsapp ? `<div class="info-item">${icon('check')}<div><b>WhatsApp</b><a href="${waHref(biz.whatsapp, biz.name)}" rel="noopener">Message us</a></div></div>` : ''}
            ${biz.email ? `<div class="info-item">${icon('mail')}<div><b>Email</b><a href="mailto:${esc(biz.email)}">${esc(biz.email)}</a></div></div>` : ''}
            ${
              addressLine(cfg)
                ? `<div class="info-item">${icon('mapPin')}<div><b>Address</b><span>${esc(addressLine(cfg))}</span></div></div>`
                : ''
            }
            <div class="info-item">${icon('clock')}<div><b>Opening hours</b>
              <table class="hours">
                <caption class="skip">Opening hours</caption>
                ${DAYS.map(([key, label]) => `<tr data-day="${key}"><th scope="row">${label}</th><td>${esc(biz.hours[key])}</td></tr>`).join('\n                ')}
              </table>
            </div></div>
            ${social.length ? `<div class="info-item">${icon('users')}<div><b>Follow</b><span>${social.map(([k, v]) => `<a href="${esc(v)}" rel="noopener">${esc(k)}</a>`).join(', ')}</span></div></div>` : ''}
            <div class="map">
              <iframe title="Map showing ${esc(biz.name)}" src="${esc(mapSrc(cfg))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function footer(cfg) {
  const biz = cfg.business;
  const year = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="#top">
            <span class="brand-mark" aria-hidden="true">${esc(initials(biz.name))}</span>
            <span class="brand-name" style="color:#fff">${esc(biz.name)}</span>
          </a>
          <p>${esc(cfg.hero.sub)}</p>
        </div>
        <div>
          <h4>Services</h4>
          <ul>${cfg.services.slice(0, 5).map((s) => `<li><a href="#services">${esc(s.name)}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="#why">Why us</a></li>
            <li><a href="#areas">Areas covered</a></li>
            <li><a href="#faq">FAQs</a></li>
            <li><a href="#quote">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            ${biz.phone ? `<li><a href="${telHref(biz.phone)}">${esc(biz.phone)}</a></li>` : ''}
            ${biz.email ? `<li><a href="mailto:${esc(biz.email)}">${esc(biz.email)}</a></li>` : ''}
            ${addressLine(cfg) ? `<li>${esc(addressLine(cfg))}</li>` : ''}
            ${biz.licence ? `<li>${esc(biz.licence)}</li>` : ''}
          </ul>
        </div>
      </div>
      <div class="legal">
        <span>&copy; ${year} ${esc(biz.name)}. All rights reserved.</span>
        <span>${esc(biz.tagline)}${biz.founded ? ` since ${esc(biz.founded)}` : ''}</span>
      </div>
    </div>
  </footer>`;
}

function callbar(cfg) {
  const biz = cfg.business;
  return `
  <div class="callbar">
    ${biz.phone ? `<a class="btn btn-primary" href="${telHref(biz.phone)}">${icon('phone')}<span>Call now</span></a>` : ''}
    <a class="btn btn-accent" href="#quote">Free quote</a>
  </div>`;
}

/* ---------- document ---------- */

export function render(cfg) {
  const biz = cfg.business;
  const font = FONT_PAIRINGS[cfg.brand.font] || FONT_PAIRINGS.modern;
  const url = siteUrl(cfg);
  const title = `${biz.name} | ${cfg.hero.headline}`;
  const description = cfg.hero.sub.slice(0, 155);

  const theme = `:root {
  --brand: ${cfg.brand.primary};
  --brand-dark: ${mix(cfg.brand.primary, 0.35, '#000000')};
  --accent: ${cfg.brand.accent};
  --ink: ${cfg.brand.ink};
  --muted: ${mix(cfg.brand.ink, 0.45, '#ffffff')};
  --bg: #ffffff;
  --surface: ${mix(cfg.brand.primary, 0.965, '#ffffff')};
  --line: ${mix(cfg.brand.ink, 0.88, '#ffffff')};
  --radius: 14px;
  --on-brand: ${readableOn(cfg.brand.primary)};
  --on-accent: ${readableOn(cfg.brand.accent)};
  --accent-ink: ${luminance(cfg.brand.accent) > 0.6 ? cfg.brand.accent : cfg.brand.primary};
  --font-head: ${font.head}, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-body: ${font.body}, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${esc(cfg.brand.primary)}">
${url ? `<link rel="canonical" href="${esc(url)}">` : ''}
<meta name="robots" content="${cfg.demo ? 'noindex, nofollow' : 'index, follow'}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="${esc(locale(cfg))}">
${url ? `<meta property="og:url" content="${esc(url)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<script type="application/ld+json">
${jsonLd(cfg)}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${cfg.demo ? `<div class="demobar">${esc(cfg.notice)} <strong>Demo</strong></div>` : ''}
${header(cfg)}
<main id="main">
${hero(cfg)}
${trustStrip(cfg)}
${services(cfg)}
${why(cfg)}
${gallery(cfg)}
${testimonials(cfg)}
${areas(cfg)}
${faqSection(cfg)}
${band(cfg)}
${contact(cfg)}
</main>
${footer(cfg)}
${callbar(cfg)}
<script src="app.js" defer></script>
</body>
</html>
`;

  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${cfg.brand.primary}"/>
  <text x="32" y="42" font-family="system-ui, sans-serif" font-size="26" font-weight="800"
        text-anchor="middle" fill="${readableOn(cfg.brand.primary)}">${esc(initials(biz.name))}</text>
</svg>
`;

  return { html, theme, favicon, title, description };
}

/* ---------- output ---------- */

function baseCss() {
  return fs.readFileSync(path.join(ASSET_DIR, 'base.css'), 'utf8');
}

export function writeSite(cfg) {
  const out = path.join(OUT_DIR, cfg.slug);
  fs.mkdirSync(out, { recursive: true });

  const { html, theme, favicon } = render(cfg);
  const url = siteUrl(cfg);

  fs.writeFileSync(path.join(out, 'index.html'), html);
  fs.writeFileSync(path.join(out, 'styles.css'), `${theme}\n\n${baseCss()}`);
  fs.copyFileSync(path.join(ASSET_DIR, 'app.js'), path.join(out, 'app.js'));
  fs.writeFileSync(path.join(out, 'favicon.svg'), favicon);

  fs.writeFileSync(
    path.join(out, 'robots.txt'),
    cfg.demo
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n${url ? `\nSitemap: ${url}/sitemap.xml\n` : ''}`
  );

  fs.writeFileSync(
    path.join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(url || `https://${cfg.slug}.example.com`)}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
`
  );

  fs.writeFileSync(
    path.join(out, '404.html'),
    `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | ${esc(cfg.business.name)}</title><link rel="stylesheet" href="styles.css"></head>
<body><main class="section"><div class="wrap" style="text-align:center;max-width:32rem">
<h1>Page not found</h1>
<p>That link does not exist any more. Try the main page or give us a ring.</p>
<p><a class="btn btn-primary" href="index.html">Back to home</a></p>
</div></main></body></html>
`
  );

  fs.writeFileSync(
    path.join(out, '_headers'),
    `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`
  );

  fs.writeFileSync(path.join(out, '.nojekyll'), '');

  fs.writeFileSync(
    path.join(out, 'HANDOFF.md'),
    `# ${cfg.business.name} handoff notes

Built with SiteForge from the \`${cfg.presetId}\` preset${cfg.demo ? ' in demo mode' : ''}.

## Replace before launch

- [ ] Business name, phone, email, address, opening hours in \`clients/${cfg.slug}.json\`, then rebuild
${cfg.demo || cfg.statsFromClient ? '' : `- [ ] Figures: the numbers row is hidden until you supply real \`stats\` in \`clients/${cfg.slug}.json\`\n`}- [ ] Gallery tiles: real job photos in \`clients/${cfg.slug}.json\` then rebuild
- [ ] Testimonials: real quotes only, never invented ones
- [ ] Form endpoint: set \`business.formEndpoint\` (Formspree, Netlify Forms, or your own handler)
- [ ] \`business.domain\` so canonical, sitemap, and OG tags are correct
- [ ] Set \`demo: false\` so the banner disappears and search engines may index the site
- [ ] Add analytics if the client wants it
${cfg.demo ? '- [ ] Demo mode is ON: the site is noindex and shows a preview banner\n' : ''}
## Deploy (free tier)

1. Create a project on Cloudflare Pages or Netlify, drag the \`sites/${cfg.slug}\` folder in
2. Point the client's domain at it and switch the SSL on
3. Rebuild and re-upload whenever content changes: \`node build.mjs ${cfg.slug}\`
`
  );

  return out;
}

export function loadClients() {
  if (!fs.existsSync(CLIENT_DIR)) return [];
  return fs
    .readdirSync(CLIENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const full = path.join(CLIENT_DIR, file);
      try {
        return { file, raw: JSON.parse(fs.readFileSync(full, 'utf8')) };
      } catch (error) {
        throw new Error(`Could not parse ${file}: ${error.message}`);
      }
    });
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    console.log('Niches:');
    nicheList().forEach((n) => console.log(`  ${n.id.padEnd(14)} ${n.label}`));
    console.log('\nClients:');
    loadClients().forEach((c) => console.log(`  ${c.file}`));
    return;
  }

  const clients = loadClients();
  if (!clients.length) {
    console.error('No client files in clients/. Copy clients/example-plumber.json to start.');
    process.exit(1);
  }

  const wanted = args.filter((a) => !a.startsWith('-'));
  const selected = wanted.length ? clients.filter((c) => wanted.includes(c.raw.slug || '')) : clients;

  if (wanted.length && !selected.length) {
    console.error(`No client matched: ${wanted.join(', ')}`);
    process.exit(1);
  }

  let failures = 0;
  for (const client of selected) {
    try {
      const cfg = mergeConfig(client.raw);
      const out = writeSite(cfg);
      const mode = cfg.demo ? 'demo' : 'live';
      console.log(`built  ${cfg.slug.padEnd(26)} ${cfg.presetId.padEnd(14)} ${mode}  ->  ${path.relative(ROOT, out)}`);
    } catch (error) {
      failures += 1;
      console.error(`failed ${client.file}: ${error.message}`);
    }
  }

  console.log(`\n${selected.length - failures}/${selected.length} site(s) built. Preview: npm run serve`);
  if (failures) process.exit(1);
}

// Only run the CLI when this file is executed directly, so test.mjs can import from it.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
