#!/usr/bin/env node
// Zero dependency preview server for built sites.
//   node server.mjs         then open http://localhost:4173

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITES = path.join(ROOT, 'sites');
const PORT = Number(process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function indexPage(slugs) {
  const items = slugs.length
    ? slugs.map((s) => `<li><a href="/${s}/">${s}</a></li>`).join('\n')
    : '<li>No sites built yet. Run <code>npm run build</code>.</li>';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SiteForge previews</title>
<style>
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#0e1420;color:#e8edf6;margin:0;padding:3rem 1.5rem}
  main{max-width:44rem;margin:0 auto}
  h1{font-size:1.6rem;margin:0 0 .4rem}
  p{color:#93a2ba}
  ul{list-style:none;padding:0;display:grid;gap:.6rem;margin-top:2rem}
  a{display:block;background:#182234;border:1px solid #263449;border-radius:12px;padding:1rem 1.2rem;color:#e8edf6;text-decoration:none;font-weight:600}
  a:hover{border-color:#4f8cff;background:#1d2941}
  code{background:#182234;padding:.15rem .4rem;border-radius:5px;font-size:.9em}
</style></head>
<body><main>
<h1>SiteForge previews</h1>
<p>Local preview server. Open a build below. Refresh after running <code>npm run build</code>.</p>
<ul>
${items}
</ul>
</main></body></html>`;
}

function send(response, status, body, type) {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url || '/').split('?')[0]);

  if (url === '/' || url === '/index.html') {
    const slugs = fs.existsSync(SITES)
      ? fs
          .readdirSync(SITES, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort()
      : [];
    return send(response, 200, indexPage(slugs), TYPES['.html']);
  }

  const target = path.join(SITES, url.replace(/^\/+/, ''));
  const resolved = path.resolve(target);

  if (!resolved.startsWith(path.resolve(SITES))) {
    return send(response, 403, 'Forbidden', TYPES['.txt']);
  }

  let file = resolved;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  if (!fs.existsSync(file)) {
    const fallback = path.join(path.dirname(file), '404.html');
    if (fs.existsSync(fallback)) return send(response, 404, fs.readFileSync(fallback), TYPES['.html']);
    return send(response, 404, 'Not found', TYPES['.txt']);
  }

  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  send(response, 200, fs.readFileSync(file), type);
});

server.listen(PORT, () => {
  console.log(`SiteForge preview running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
