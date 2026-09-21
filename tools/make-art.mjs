#!/usr/bin/env node
// One command to make the artwork for a trade or a client.
//
//   npm run art -- preset barber          hero panel + three gallery stills for the trade
//   npm run art -- client peaky-barbers   the link preview card for one business
//
// Writes into assets/presets/<preset>/ or assets/clients/<slug>/, which is where
// build.mjs looks. Pillow does the drawing, so this is the one step in the
// project that needs Python; the build and the tests stay zero-dependency.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [mode, name] = process.argv.slice(2);

if (!mode || !name) {
  console.error('usage: npm run art -- <preset|client> <name>');
  process.exit(1);
}

const spec = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'art-spec.mjs'), mode, name], {
  cwd: ROOT,
  encoding: 'utf8',
});

if (spec.status !== 0) {
  process.stderr.write(spec.stderr || `art-spec failed for ${mode} ${name}\n`);
  process.exit(spec.status || 1);
}

const specFile = path.join(os.tmpdir(), `siteforge-art-${mode}-${name}.json`);
fs.writeFileSync(specFile, spec.stdout);

const python = spawnSync('python3', [path.join(ROOT, 'tools', 'make-preset-art.py'), specFile], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (python.error && python.error.code === 'ENOENT') {
  console.error('python3 not found. The artwork step needs Python with Pillow installed.');
  process.exit(1);
}

process.exit(python.status ?? 1);
