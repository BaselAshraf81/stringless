#!/usr/bin/env node
// Assembles the showcase into site/dist: the page, the live examples and the runtime they use.
// usage: node site/build.mjs
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = dirname(fileURLToPath(import.meta.url));
const assets = join(site, '..', 'skills', 'stringless', 'assets');
const out = join(site, 'dist');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of ['index.html', '404.html', 'site.css', 'reel.js', 'favicon.svg', 'og.jpg']) {
  if (existsSync(join(site, f))) cpSync(join(site, f), join(out, f));
}
cpSync(join(site, 'fonts'), join(out, 'fonts'), { recursive: true });
cpSync(join(assets, 'examples'), join(out, 'examples'), { recursive: true });
cpSync(join(assets, 'runtime'), join(out, 'runtime'), { recursive: true });
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://stringless.baselashraf.com/sitemap.xml\n');
writeFileSync(join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://stringless.baselashraf.com/</loc></url></urlset>\n');
// Workers static assets reads _headers. Fonts never change. The reel reloads an example on every scene,
// so examples and the runtime get a short cache instead of a revalidation round trip each time.
const brief = '  Cache-Control: public, max-age=600, stale-while-revalidate=86400\n';
writeFileSync(join(out, '_headers'), [
  '/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n',
  '/examples/*\n' + brief,
  '/runtime/*\n' + brief,
  '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n'
].join(''));
console.log('built', out);
