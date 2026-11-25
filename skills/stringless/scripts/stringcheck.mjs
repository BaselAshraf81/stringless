#!/usr/bin/env node
// Stringless string detector. Zero dependencies, no network, no LLM.
//
// usage:
//   node stringcheck.mjs <files or folders...>              floor checks; exit 2 when errors are found
//   node stringcheck.mjs --inventory <files or folders...>  list every visible control string (input for `map`)
//   add --json for machine-readable output, --quiet to print errors only
//
// Reads .html .htm .jsx .tsx .vue .svelte .astro, plus .js/.ts files that contain markup,
// and .css/.scss/.less. Heuristic by design: it reads source text, not a rendered page.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative, resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const INVENTORY = flags.has('--inventory');
const JSON_OUT = flags.has('--json');
const QUIET = flags.has('--quiet');

if (!targets.length || flags.has('--help')) {
  console.log('usage: node stringcheck.mjs [--inventory] [--json] [--quiet] <files or folders...>');
  process.exit(targets.length ? 0 : 1);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.output', 'coverage', '.turbo', '.vercel', '.cache', 'vendor', '.stringless', '.impeccable']);
const MARKUP = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const SCRIPT = new Set(['.js', '.mjs', '.ts', '.mts']);
const STYLE = new Set(['.css', '.scss', '.less']);
const RUNTIME_FILES = new Set(['stringless.js', 'stringless.css', 'stringless.min.js', 'stringless.min.css']);

const HEAVY_VERBS = new Set(['delete', 'remove', 'destroy', 'burn', 'erase', 'clear', 'reset', 'revoke', 'unsubscribe', 'purchase', 'pay', 'transfer', 'wipe', 'discard', 'drop', 'shred', 'terminate', 'close-account', 'leave', 'ban', 'kick', 'overwrite', 'publish-all', 'send-all']);
const GENERIC = new Set(['click here', 'here', 'submit', 'ok', 'okay', 'go', 'more', 'learn more', 'read more', 'click', 'continue', 'button', 'link', 'yes', 'no']);
const NATIVE_FOCUSABLE = new Set(['button', 'input', 'select', 'textarea', 'summary']);

// ------------------------------------------------------------------ files
function walk(p, out) {
  if (!existsSync(p)) { console.error(`stringcheck: not found: ${p}`); process.exitCode = 1; return; }
  const st = statSync(p);
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(basename(p))) return;
    for (const name of readdirSync(p)) walk(join(p, name), out);
    return;
  }
  const ext = extname(p).toLowerCase();
  if (RUNTIME_FILES.has(basename(p))) return;
  if (MARKUP.has(ext) || SCRIPT.has(ext) || STYLE.has(ext)) out.push(p);
}
const files = [];
for (const t of targets) walk(resolve(t), files);

// ------------------------------------------------------------------ helpers
function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) starts.push(i + 1);
  return (idx) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

const TAG_RE = /<([A-Za-z][\w:.-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
const ATTR_RE = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}|([^\s"'=<>`]+)))?/g;

function parseAttrs(s) {
  const attrs = Object.create(null);
  if (!s) return attrs;
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(s))) {
    const name = m[1];
    let value = true;
    if (m[2] != null) value = m[2];
    else if (m[3] != null) value = m[3];
    else if (m[4] != null) value = '{' + m[4] + '}';
    else if (m[5] != null) value = m[5];
    attrs[name.toLowerCase()] = value;
  }
  return attrs;
}

function innerOf(src, tag, from) {
  const re = new RegExp(`<(/?)${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s>/])[^>]*?(/?)>`, 'g');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(src))) {
    if (m[1]) { depth--; if (depth === 0) return src.slice(from, m.index); }
    else if (!m[2]) depth++;
    if (re.lastIndex - from > 20000) break;
  }
  return '';
}

const SR_ONLY = /<(\w+)[^>]*\bclass(?:Name)?\s*=\s*["'{][^"'}]*\b(?:sr-only|visually-hidden|visuallyhidden|screen-reader-text)\b[^>]*>[\s\S]*?<\/\1>/gi;
function textOf(inner) {
  let srOnly = false;
  let t = inner.replace(SR_ONLY, () => { srOnly = true; return ' '; });
  const hasGraphic = /<(svg|img|picture|canvas)\b|<i\b[^>]*\bclass(?:Name)?=["'][^"']*\bicon/i.test(t);
  t = t.replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
  return { text: t, srOnly, hasGraphic };
}

const hasName = (a) => !!(a['aria-label'] || a['aria-labelledby'] || a['title'] || a[':aria-label'] || a['v-bind:aria-label'] || a['arialabel']);
const isHandler = (a) => Object.keys(a).some((k) => /^(onclick|@click|v-on:click|on:click|\(click\))$/.test(k));

// ------------------------------------------------------------------ checks
const findings = [];
const inventory = [];
let scanned = 0;

// Waivers: a comment "stringcheck-disable <rule>[, <rule>]: <reason>" on the finding's line or the line above.
let waivers = new Map();
let waived = 0;
function collectWaivers(src, at) {
  waivers = new Map();
  const re = /stringcheck-disable\s+([\w-]+(?:\s*,\s*[\w-]+)*)/g;
  let m;
  while ((m = re.exec(src))) {
    const line = at(m.index);
    const set = waivers.get(line) || new Set();
    m[1].split(/\s*,\s*/).forEach((r) => set.add(r));
    waivers.set(line, set);
  }
}
function report(file, line, level, rule, message) {
  for (const l of [line, line - 1]) { const set = waivers.get(l); if (set && (set.has(rule) || set.has('all'))) { waived++; return; } }
  findings.push({ file, line, level, rule, message });
}

function checkMarkup(file, src, at) {
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(src))) {
    const rawTag = m[1];
    const tag = rawTag.toLowerCase();
    if (tag === 'script' || tag === 'style') continue;
    const attrs = parseAttrs(m[2]);
    const selfClosing = m[3] === '/' || /^(input|img|br|hr|meta|link|area|source|wbr)$/.test(tag);
    const line = at(m.index);
    const role = typeof attrs.role === 'string' ? attrs.role : '';
    const componentButton = /^[A-Z]/.test(rawTag) && /button$/i.test(rawTag);
    const componentLink = /^[A-Z]/.test(rawTag) && /^(link|navlink|a)$/i.test(rawTag);
    const isButtonish = tag === 'button' || role === 'button' || componentButton || (tag === 'input' && /^(submit|button|reset)$/i.test(String(attrs.type || '')));
    const isLink = (tag === 'a' && attrs.href != null) || componentLink || role === 'link';
    const isControl = isButtonish || isLink || role === 'switch' || role === 'checkbox' || role === 'radio' || role === 'tab' || role === 'menuitem';
    const sl = attrs['data-sl-verb'] != null;

    let content = null;
    const getContent = () => content || (content = selfClosing ? { text: '', srOnly: false, hasGraphic: false } : textOf(innerOf(src, rawTag, TAG_RE.lastIndex)));

    // --- stringless controls
    if (sl) {
      const verb = String(attrs['data-sl-verb']);
      const c = getContent();
      // A wrapper around a native control (a <label> around a radio) takes its focus and name from it.
      const innerHtml = selfClosing ? '' : innerOf(src, rawTag, TAG_RE.lastIndex);
      const innerNative = /<(input|select|textarea|button)\b(?![^>]*type\s*=\s*["']?hidden)[^>]*>/i.exec(innerHtml);
      const innerNamed = innerNative && /\baria-label(ledby)?\s*=|\btitle\s*=/.test(innerNative[0]);
      const named = hasName(attrs) || c.srOnly || innerNamed || (tag === 'label' && innerNative && c.text);
      if (!named && !c.text) report(file, line, 'error', 'sl-name', `Stringless control (verb "${verb}") has no accessible name. Add aria-label; it also feeds the caption layer.`);
      if (c.text && !/^\{.*\}$/.test(c.text)) report(file, line, 'warn', 'sl-painted-words', `Visible words inside a stringless control: "${c.text.slice(0, 40)}". Move them to aria-label; captions show them on demand.`);
      const focusable = innerNative || NATIVE_FOCUSABLE.has(tag) || (tag === 'a' && attrs.href != null) || componentButton || componentLink || attrs.tabindex != null || attrs.tabIndex != null;
      if (!focusable) report(file, line, 'error', 'sl-focus', `<${rawTag}> with data-sl-verb can't be reached by keyboard. Use a <button>, or add role and tabindex="0".`);
      if (!innerNative && !NATIVE_FOCUSABLE.has(tag) && !(tag === 'a' && attrs.href != null) && !componentButton && !componentLink && !role) report(file, line, 'error', 'sl-role', `<${rawTag}> with data-sl-verb has no role. Use a <button>, or set role="button".`);
      if (String(attrs['aria-hidden']) === 'true') report(file, line, 'error', 'sl-hidden', 'Stringless control is aria-hidden, so screen readers skip it.');
      if (HEAVY_VERBS.has(verb.toLowerCase()) && String(attrs['data-sl-weight'] || '') !== 'heavy') report(file, line, 'warn', 'sl-weight', `Verb "${verb}" is usually heavy. Set data-sl-weight="heavy" (hold or press twice) and leave an echo with undo.`);
      if (attrs['data-sl-target'] == null) report(file, line, 'info', 'sl-target', `No data-sl-target on "${verb}": nothing answers the approach. Bind it to what it acts on, or use "self".`);
    }

    // --- general control checks
    if (isButtonish && !sl) {
      const c = getContent();
      const valueText = tag === 'input' ? String(attrs.value || '') : '';
      if (!hasName(attrs) && !c.text && !c.srOnly && !valueText) report(file, line, 'error', 'icon-only-name', `<${rawTag}> has no text and no accessible name${c.hasGraphic ? ' (icon only)' : ''}.`);
    }
    if (!isControl && !sl && isHandler(attrs) && /^(div|span|li|img|p|section|article|td|tr|svg|g|path)$/.test(tag) && (!role || attrs.tabindex == null)) {
      report(file, line, 'error', 'clickable-div', `<${rawTag}> has a click handler but no ${role ? 'tabindex' : 'role and tabindex'}. Keyboard users can't use it; prefer a <button>.`);
    }

    // --- generic labels and inventory
    if (isControl || (tag === 'input' && attrs.placeholder) || tag === 'label' || (attrs.title && !sl)) {
      const c = isControl || tag === 'label' ? getContent() : { text: '' };
      const visible = tag === 'input' && isButtonish ? String(attrs.value || '') : c.text;
      if (isControl && visible && GENERIC.has(visible.toLowerCase())) report(file, line, 'warn', 'generic-label', `Generic label "${visible}". Name the action, or make the control show it.`);
      if (INVENTORY) {
        const kind = tag === 'label' ? 'label' : tag === 'input' && !isButtonish ? 'placeholder' : isLink ? 'link' : role && role !== 'button' ? role : 'button';
        const entry = { file, line, kind, element: rawTag, text: kind === 'placeholder' ? String(attrs.placeholder) : visible, ariaLabel: attrs['aria-label'] ? String(attrs['aria-label']) : '', title: attrs.title ? String(attrs.title) : '', stringless: sl };
        if (entry.text || entry.ariaLabel || entry.title || kind === 'button') inventory.push(entry);
      }
    }
  }
}

function checkStyle(file, css, at, offset = 0) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (s) => ' '.repeat(s.length));
  const hasFocusVisible = /:focus-visible/.test(clean);
  const re = /outline\s*:\s*(none|0)\b/g;
  let m;
  while ((m = re.exec(clean))) if (!hasFocusVisible) report(file, at(offset + m.index), 'error', 'focus-removed', 'Outline removed with no :focus-visible style in this file. Keep a visible focus that follows the shape.');

  const moves = /(^|[;{\s])(animation|transition)\s*:|@keyframes/.test(clean) && !/(animation|transition)\s*:\s*none\s*;?\s*}/.test(clean.trim());
  if (moves && !/prefers-reduced-motion/.test(clean) && !/--sl-motion/.test(clean)) {
    const i = clean.search(/(animation|transition)\s*:|@keyframes/);
    report(file, at(offset + Math.max(0, i)), 'warn', 'reduced-motion', 'Motion with no prefers-reduced-motion handling (and no --sl-motion). Give every verb a still version that keeps its meaning.');
  }

  const loop = /animation(?:-iteration-count)?\s*:[^;{}]*\binfinite\b/g;
  while ((m = loop.exec(clean))) report(file, at(offset + m.index), 'warn', 'idle-loop', 'Infinite animation. Calm at rest: loop only for a state that needs the user, and stop when it resolves.');

  const ruleRe = /([^{}@;]+)\{/g;
  let hoverCount = 0;
  while ((m = ruleRe.exec(clean))) {
    const selector = m[1].trim();
    if (!selector.includes(':hover')) continue;
    const parts = selector.split(',').map((s) => s.trim()).filter((s) => s.includes(':hover'));
    for (const p of parts) {
      const base = p.replace(/:hover/g, '').trim();
      const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const twin = new RegExp(escaped.replace(/\\ /g, '\\s+') + '\\s*:(focus-visible|focus-within|focus)\\b').test(clean) || new RegExp(escaped + '\\s*\\[data-sl-').test(clean);
      if (!twin && hoverCount < 12) { hoverCount++; report(file, at(offset + m.index + Math.max(0, m[1].search(/\S/))), 'warn', 'hover-only', `"${p}" has no :focus-visible twin. Meaning that needs hover is a bug; give keyboard and touch the same reveal.`); }
    }
  }
}

function checkScript(file, js, at, offset = 0) {
  const re = /addEventListener\(\s*['"]sl:(rehearse|near)['"]/g;
  let m;
  while ((m = re.exec(js))) {
    const body = js.slice(m.index, m.index + 600);
    if (/\bfetch\s*\(|XMLHttpRequest|sendBeacon|axios\.|\.(post|put|patch|delete)\s*\(|localStorage\.setItem|indexedDB/.test(body)) {
      report(file, at(offset + m.index), 'error', 'rehearsal-write', 'A rehearsal handler writes data or calls the network. Rehearsals are previews: visual and reversible only.');
    }
  }
}

for (const abs of files) {
  const file = relative(process.cwd(), abs) || abs;
  let src;
  try { src = readFileSync(abs, 'utf8'); } catch { continue; }
  const ext = extname(abs).toLowerCase();
  const at = lineIndex(src);
  collectWaivers(src, at);
  scanned++;
  if (STYLE.has(ext)) { checkStyle(file, src, at); continue; }
  if (SCRIPT.has(ext)) {
    checkScript(file, src, at);
    if (/<[A-Za-z][\w.-]*[\s>]/.test(src) && /(return\s*\(|=>\s*\(|html`|<\/)/.test(src)) checkMarkup(file, src, at);
    continue;
  }
  checkMarkup(file, src, at);
  let m;
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleRe.exec(src))) checkStyle(file, m[1], at, m.index + m[0].indexOf(m[1]));
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(src))) checkScript(file, m[1], at, m.index + m[0].indexOf(m[1]));
  if (ext === '.jsx' || ext === '.tsx') checkScript(file, src, at);
}

// ------------------------------------------------------------------ output
findings.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
const errors = findings.filter((f) => f.level === 'error');
const warns = findings.filter((f) => f.level === 'warn');
const infos = findings.filter((f) => f.level === 'info');

if (JSON_OUT) {
  console.log(JSON.stringify({ scanned, errors: errors.length, warnings: warns.length, findings, inventory: INVENTORY ? inventory : undefined }, null, 2));
} else {
  if (INVENTORY) {
    const byFile = new Map();
    for (const e of inventory) { if (!byFile.has(e.file)) byFile.set(e.file, []); byFile.get(e.file).push(e); }
    console.log(`stringcheck inventory: ${inventory.length} control strings in ${byFile.size} file(s)`);
    for (const [file, list] of byFile) {
      const labeled = list.filter((e) => e.text && !e.stringless).length;
      console.log(`\n${file}  (${list.length} entries, ${labeled} visible labels)`);
      for (const e of list) {
        const shown = e.text ? `"${e.text.slice(0, 60)}"` : '(no visible text)';
        const extra = [e.ariaLabel && `aria-label "${e.ariaLabel}"`, e.title && `title "${e.title}"`, e.stringless && 'stringless'].filter(Boolean).join(', ');
        console.log(`  ${String(e.line).padStart(5)}  ${e.kind.padEnd(11)} ${shown}${extra ? '  [' + extra + ']' : ''}`);
      }
    }
    console.log('');
  }
  const shown = QUIET ? errors : INVENTORY ? errors.concat(warns) : findings;
  for (const f of shown) console.log(`${f.file}:${f.line}  ${f.level.padEnd(5)}  ${f.rule.padEnd(16)} ${f.message}`);
  console.log(`\nstringcheck: ${scanned} file(s), ${errors.length} error(s), ${warns.length} warning(s), ${infos.length} note(s)${waived ? `, ${waived} waived` : ''}`);
}

process.exit(errors.length && !INVENTORY ? 2 : process.exitCode || 0);
