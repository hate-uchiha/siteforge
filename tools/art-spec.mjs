#!/usr/bin/env node
// Emit an art spec as JSON for the asset generator (tools/make-preset-art.py).
//
//   node tools/art-spec.mjs preset barber          -> hero + craft stills + a trade level card
//   node tools/art-spec.mjs client peaky-barbers   -> a card for that client's own name and copy
//
// The spec is built from the real preset module and mergeConfig, so the artwork can
// never drift away from the copy the page actually shows.

import { presets, getPreset } from '../presets/index.mjs';
import { mergeConfig } from '../build.mjs';

const [mode, name] = process.argv.slice(2);

if (!mode || !name) {
  console.error('usage: node tools/art-spec.mjs <preset|client> <name>');
  process.exit(1);
}

if (mode === 'preset') {
  const preset = getPreset(name);
  if (!preset) {
    console.error(`unknown preset: ${name} (have: ${Object.keys(presets).join(', ')})`);
    process.exit(1);
  }
  process.stdout.write(
    JSON.stringify(
      {
        mode: 'preset',
        key: name,
        label: preset.label,
        brand: preset.brand,
        hero: preset.hero,
        trust: preset.trust,
        business: { name: preset.label },
        galleryLabels: preset.galleryLabels,
      },
      null,
      2
    ) + '\n'
  );
  process.exit(0);
}

if (mode === 'client') {
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const file = path.join(root, 'clients', `${name}.json`);

  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`cannot read ${file}: ${error.message}`);
    process.exit(1);
  }

  const cfg = mergeConfig(raw);
  process.stdout.write(
    JSON.stringify(
      {
        mode: 'client',
        key: cfg.slug,
        label: (presets[cfg.presetId] || {}).label || cfg.presetId,
        brand: cfg.brand,
        hero: cfg.hero,
        trust: cfg.trust,
        business: { name: cfg.business.name, phone: cfg.business.phone || '' },
        areas: cfg.business.areas || [],
      },
      null,
      2
    ) + '\n'
  );
  process.exit(0);
}

console.error(`unknown mode: ${mode}`);
process.exit(1);
