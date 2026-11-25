#!/usr/bin/env node
// Stringless static preview server. Zero dependencies.
// usage: node serve.mjs [dir] [--port 4173] [--host 127.0.0.1]
// Serves a folder so components can be opened, screenshotted and cold-read.

import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const root = resolve(positional[0] || '.');
const port = Number(flag('--port', 4173));
const host = flag('--host', '127.0.0.1');

const types = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

async function listing(dir, urlPath) {
  const { readdir } = await import('node:fs/promises');
  const items = await readdir(dir, { withFileTypes: true });
  const rows = items
    .filter((d) => !d.name.startsWith('.'))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map((d) => `<li><a href="${encodeURI(urlPath.replace(/\/?$/, '/') + d.name)}${d.isDirectory() ? '/' : ''}">${d.name}${d.isDirectory() ? '/' : ''}</a></li>`)
    .join('');
  return `<!doctype html><meta charset="utf-8"><title>${urlPath}</title><style>body{font:15px/1.6 system-ui;margin:2rem;color:#222}a{color:#1d4ed8}</style><h1>${urlPath}</h1><ul>${rows}</ul>`;
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, urlPath));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) {
      const index = join(file, 'index.html');
      const hasIndex = await stat(index).catch(() => null);
      if (hasIndex) { file = index; info = hasIndex; }
      else { res.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' }).end(await listing(file, urlPath)); return; }
    }
    if (!info) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found: ' + urlPath); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(err && err.message || err));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${port} is busy. Try --port ${port + 1}.`);
  else console.error(err.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`stringless serve: ${root}`);
  console.log(`http://${host}:${port}/`);
});
