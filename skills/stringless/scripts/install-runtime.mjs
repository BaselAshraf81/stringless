#!/usr/bin/env node
// Copy the Stringless runtime into a project.
// usage: node install-runtime.mjs [--dest <folder>] [--force]
// Default destination: public/stringless/ when public/ exists, static/stringless/ when static/ exists, else ./stringless/.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', 'assets', 'runtime');
const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const force = args.includes('--force');

let dest = opt('--dest');
let webRoot = null;
if (!dest) {
  if (existsSync('public')) { dest = 'public/stringless'; webRoot = 'public'; }
  else if (existsSync('static')) { dest = 'static/stringless'; webRoot = 'static'; }
  else dest = 'stringless';
}
dest = resolve(dest);
mkdirSync(dest, { recursive: true });

const version = (text) => (/Stringless runtime(?: styles)? (\d+\.\d+\.\d+)/.exec(text) || [])[1] || 'unknown';
let copied = 0;
for (const name of ['stringless.js', 'stringless.css']) {
  const from = join(src, name);
  const to = join(dest, name);
  const incoming = readFileSync(from, 'utf8');
  if (existsSync(to) && !force) {
    const current = readFileSync(to, 'utf8');
    if (current === incoming) { console.log(`up to date  ${relative(process.cwd(), to)} (${version(current)})`); continue; }
    console.log(`kept        ${relative(process.cwd(), to)} (${version(current)}; bundled is ${version(incoming)}). Pass --force to replace it.`);
    continue;
  }
  copyFileSync(from, to);
  copied++;
  console.log(`copied      ${relative(process.cwd(), to)} (${version(incoming)})`);
}

const rel = relative(webRoot ? resolve(webRoot) : process.cwd(), dest).split('\\').join('/');
const base = webRoot ? '/' + rel : './' + rel;
console.log('');
console.log('Add to the page head (or import from your entry file):');
console.log(`  <link rel="stylesheet" href="${base}/stringless.css">`);
console.log(`  <script src="${base}/stringless.js" defer></script>`);
if (!copied) process.exitCode = 0;
