#!/usr/bin/env node
// Runs every check: skill structure, the scripts, and each example in headless Chrome.
// usage: node tests/run.mjs [--no-browser] [scenario-name ...]
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = join(root, 'skills', 'stringless');
const args = process.argv.slice(2);
const noBrowser = args.includes('--no-browser');
const only = args.filter((a) => !a.startsWith('--'));
let failures = 0;
const ok = (cond, label) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}`); if (!cond) failures++; };
const node = (file, argv, opts = {}) => spawnSync(process.execPath, [file, ...argv], { cwd: root, encoding: 'utf8', ...opts });

// ---- structure
console.log('skill structure');
const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
ok(!!fm, 'SKILL.md starts with YAML frontmatter');
const front = fm ? fm[1] : '';
const name = (/^name:\s*(.+)$/m.exec(front) || [])[1];
const desc = (/^description:\s*(.+)$/m.exec(front) || [])[1] || '';
ok(name === 'stringless', 'name matches the folder');
ok(desc.length > 0 && desc.length <= 1024, `description is 1 to 1024 characters (${desc.length})`);
const keys = front.split(/\r?\n/).filter((l) => /^[a-z-]+:/.test(l)).map((l) => l.split(':')[0]);
ok(keys.every((k) => ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'].includes(k)), `frontmatter uses only Agent Skills fields (${keys.join(', ')})`);
ok(md.split('\n').length < 500, 'SKILL.md is under 500 lines');
const links = [...md.matchAll(/\]\((reference\/[^)#]+)\)/g)].map((m) => m[1]);
const missing = links.filter((l) => !existsSync(join(skill, l)));
ok(!missing.length, `every reference SKILL.md links exists${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}`);
for (const f of readdirSync(join(skill, 'reference'), { recursive: true }).filter((f) => String(f).endsWith('.md'))) {
  const text = readFileSync(join(skill, 'reference', String(f)), 'utf8');
  const dashes = (text.match(/\u2014/g) || []).length;
  if (dashes) ok(false, `no em dashes in reference/${f} (${dashes})`);
}
const examples = readdirSync(join(skill, 'assets', 'examples')).filter((f) => f.endsWith('.html'));
for (const ex of examples) ok(md.includes(ex.replace('.html', '')), `SKILL.md mentions example ${ex}`);
for (const j of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
  try { JSON.parse(readFileSync(join(root, j), 'utf8')); ok(true, `${j} is valid JSON`); } catch (e) { ok(false, `${j}: ${e.message}`); }
}

// ---- scripts
console.log('scripts');
let r = node(join(skill, 'scripts', 'stringcheck.mjs'), ['tests/fixtures/bad.html', '--json']);
let out = {};
try { out = JSON.parse(r.stdout); } catch {}
ok(r.status === 2, 'stringcheck exits 2 on the bad fixture');
const rules = new Set((out.findings || []).map((f) => f.rule));
for (const rule of ['icon-only-name', 'clickable-div', 'sl-focus', 'sl-role', 'sl-weight', 'sl-painted-words', 'focus-removed', 'reduced-motion', 'idle-loop', 'rehearsal-write', 'generic-label']) ok(rules.has(rule), `stringcheck catches ${rule}`);
r = node(join(skill, 'scripts', 'stringcheck.mjs'), ['skills/stringless/assets/examples', 'gallery', 'site/index.html', 'site/404.html']);
ok(r.status === 0 && /0 error\(s\), 0 warning\(s\)/.test(r.stdout), 'examples, gallery and site pass stringcheck with no warnings');
r = node(join(skill, 'scripts', 'roll.mjs'), ['--verb', 'delete', '--object', 'note', '--json', '--seed', '7']);
try { const j = JSON.parse(r.stdout); ok(j.results.length === 1 && j.results[0].material && j.results[0].constraint, 'roll returns seeds'); } catch { ok(false, 'roll returns JSON'); }
const a = node(join(skill, 'scripts', 'roll.mjs'), ['--seed', '42', '--json']).stdout;
const b = node(join(skill, 'scripts', 'roll.mjs'), ['--seed', '42', '--json']).stdout;
ok(a === b, 'roll is reproducible with --seed');
r = node(join(skill, 'scripts', 'roll.mjs'), ['--world', '--count', '3', '--json']);
try { ok(JSON.parse(r.stdout).results.length === 3, 'roll --world returns three worlds'); } catch { ok(false, 'roll --world returns JSON'); }
r = spawnSync(process.execPath, ['--check', join(skill, 'assets', 'runtime', 'stringless.js')], { encoding: 'utf8' });
ok(r.status === 0, 'runtime parses');

// ---- browser scenarios
if (!noBrowser) {
  r = node(join(root, 'site', 'build.mjs'), []);
  ok(r.status === 0, 'the site builds');
  const port = 4300 + Math.floor(Math.random() * 400);
  const server = spawn(process.execPath, [join(skill, 'scripts', 'serve.mjs'), root, '--port', String(port)], { stdio: 'ignore' });
  await new Promise((res) => setTimeout(res, 600));
  try {
    const dir = join(root, 'tests', 'scenarios');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.mjs'))) {
      const id = file.replace('.mjs', '');
      if (only.length && !only.includes(id)) continue;
      console.log(id);
      const res = spawnSync(process.execPath, [join(root, 'tests', 'cdp.mjs'), join(dir, file)], { cwd: root, encoding: 'utf8', env: { ...process.env, BASE: `http://127.0.0.1:${port}/` }, timeout: 120000 });
      process.stdout.write(res.stdout || '');
      if (res.stderr) process.stdout.write(res.stderr);
      if (res.status !== 0) failures++;
    }
  } finally {
    server.kill();
  }
}

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exitCode = failures ? 1 : 0;
