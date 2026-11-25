#!/usr/bin/env node
// Stringless roll: random creative seeds so concepts don't converge on the same few ideas.
//
// usage:
//   node roll.mjs [--verb delete] [--object note] [--count 3] [--seed 42] [--json]
//   node roll.mjs --world [--count 3]
//   node roll.mjs --lexicon path/to/LEXICON.md     (default: ./LEXICON.md, then ./docs/LEXICON.md)
//
// Seeds the LEXICON.md "Tried" section already mentions are skipped.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'data', 'seeds.json'), 'utf8'));

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };

if (has('--help') || has('-h')) {
  console.log('usage: node roll.mjs [--verb <verb>] [--object <noun>] [--count N] [--seed N] [--world] [--lexicon <path>] [--json]');
  process.exit(0);
}

const verb = (opt('--verb', '') || '').toLowerCase();
const object = opt('--object', '');
const count = Math.max(1, Math.min(9, Number(opt('--count', 1)) || 1));
const seedArg = opt('--seed', null);
const seed = seedArg != null ? Number(seedArg) >>> 0 : randomInt(1, 2 ** 31 - 1);

// mulberry32: small, fast, reproducible with --seed
let state = seed >>> 0;
const rand = () => {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];

// ---- Tried list from LEXICON.md
function findLexicon() {
  const explicit = opt('--lexicon', null);
  const candidates = explicit ? [explicit] : ['LEXICON.md', 'docs/LEXICON.md', '.stringless/LEXICON.md'];
  for (const c of candidates) { const p = resolve(c); if (existsSync(p)) return p; }
  return null;
}
const lexiconPath = findLexicon();
let tried = [];
if (lexiconPath) {
  const text = readFileSync(lexiconPath, 'utf8');
  const m = /^##\s+Tried\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im.exec(text);
  if (m) tried = m[1].split(/\r?\n/).map((l) => l.trim()).filter((l) => /^[-*]\s+/.test(l)).map((l) => l.replace(/^[-*]\s+/, ''));
}
tried = tried.filter((t) => !t.startsWith('['));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTried = (name) => { const re = new RegExp(`\\b${escapeRe(name)}\\b`, 'i'); return tried.some((t) => re.test(t)); };

// ---- affinity: half the picks lean toward seeds that suit the verb, half are pure chance
const verbTags = data.verbs[verb] || [];
function choose(family, used) {
  const all = data.families[family].filter((e) => !isTried(e.name) && !used.has(e.name));
  const pool = all.length ? all : data.families[family];
  if (verbTags.length && rand() < 0.5) {
    const fit = pool.filter((e) => (e.tags || []).some((t) => verbTags.includes(t)));
    if (fit.length) return { ...pick(fit), fit: true };
  }
  return { ...pick(pool), fit: false };
}

function roll(used) {
  const out = {};
  for (const family of ['material', 'craft', 'phenomenon', 'mechanism', 'scene', 'property', 'time']) {
    const e = choose(family, used);
    used.add(e.name);
    out[family] = e;
  }
  out.constraint = pick(data.constraints);
  const a = pick(data.families.material.filter((e) => !used.has(e.name)));
  const b = pick(data.families.mechanism.filter((e) => !used.has(e.name)));
  const c = pick(data.families.phenomenon.filter((e) => !used.has(e.name)));
  const forms = [
    `a ${a.name} ${b.name}`,
    `${c.name} inside a ${b.name}`,
    `a ${b.name} made of ${a.name}`,
    `${a.name} that behaves like ${c.name}`
  ];
  out.wildcard = pick(forms);
  return out;
}

function world() {
  const scene = pick(data.families.scene.filter((e) => !isTried(e.name)));
  const mats = [];
  while (mats.length < 3) { const m = pick(data.families.material); if (!mats.includes(m.name)) mats.push(m.name); }
  return { scene: scene.name, hint: scene.hint, light: pick(data.lights), era: pick(data.eras), materials: mats };
}

const json = has('--json');
const results = [];
const used = new Set();
for (let i = 0; i < count; i++) results.push(has('--world') ? world() : roll(used));

if (json) {
  console.log(JSON.stringify({ seed, verb: verb || null, object: object || null, lexicon: lexiconPath, tried, results }, null, 2));
  process.exit(0);
}

const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
const head = has('--world') ? 'stringless roll --world' : `stringless roll${verb ? `  verb: ${verb}` : ''}${object ? `  object: ${object}` : ''}`;
console.log(`${head}   (seed ${seed}, repeat with --seed ${seed})`);
if (verb && !verbTags.length) console.log(`note: "${verb}" has no affinity entry; every pick is pure chance.`);
results.forEach((r, i) => {
  console.log('');
  if (count > 1) console.log(`roll ${i + 1}`);
  if (has('--world')) {
    console.log(`  scene       ${r.scene}  (${r.hint})`);
    console.log(`  light       ${r.light}`);
    console.log(`  era         ${r.era}`);
    console.log(`  materials   ${r.materials.join(', ')}`);
    return;
  }
  for (const family of ['material', 'craft', 'phenomenon', 'mechanism', 'scene', 'property', 'time']) {
    const e = r[family];
    console.log(`  ${pad(family, 11)} ${pad(e.name + (e.fit ? ' *' : ''), 26)} ${e.hint || ''}`);
  }
  console.log(`  ${pad('constraint', 11)} ${r.constraint}`);
  console.log(`  ${pad('wildcard', 11)} ${r.wildcard}`);
});
console.log('');
if (verbTags.length) console.log('* leans toward the verb. Everything else is chance; chance is the point.');
if (lexiconPath) console.log(tried.length ? `skipped ${tried.length} tried idea(s) from ${lexiconPath}` : `no Tried entries in ${lexiconPath} yet`);
console.log('Use at least one seed, or say in one line why each was rejected. Add what you used to LEXICON.md "Tried".');
