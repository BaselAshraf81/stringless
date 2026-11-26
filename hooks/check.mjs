#!/usr/bin/env node
// Claude Code hooks for Stringless, wired in hooks/hooks.json.
//   node check.mjs post-edit   PostToolUse: after the agent edits a file that uses Stringless, run
//                              stringcheck on it and hand any problems back to the agent.
//   node check.mjs session     SessionStart: in a project with a Stringless LEXICON.md, tell the agent.
// STRINGLESS_HOOK=0 turns both off. Any failure stays silent: a hook must never get in the way of an edit.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const stringcheck = join(here, '..', 'skills', 'stringless', 'scripts', 'stringcheck.mjs');
const CHECKED = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.js', '.mjs', '.ts', '.mts', '.css', '.scss', '.less']);
// Stringless work uses its attributes, its variables or its API. Other UI isn't this hook's business.
const USES_STRINGLESS = /data-sl-|--sl-|Stringless\./;
const MAX = 12;

function postEdit(input) {
  const ti = input.tool_input || {};
  const file = ti.file_path || ti.path;
  if (!file) return;
  const abs = resolve(input.cwd || process.cwd(), file);
  if (!CHECKED.has(extname(abs).toLowerCase()) || !existsSync(abs)) return;
  if (!USES_STRINGLESS.test(readFileSync(abs, 'utf8'))) return;
  const r = spawnSync(process.execPath, [stringcheck, abs, '--json'], { encoding: 'utf8', timeout: 15000 });
  const found = (JSON.parse(r.stdout).findings || []).filter((f) => f.level === 'error' || f.level === 'warn');
  if (!found.length) return;
  const lines = found.slice(0, MAX).map((f) => `- line ${f.line}, ${f.level} ${f.rule}: ${f.message}`);
  if (found.length > MAX) lines.push(`- ${found.length - MAX} more; stringcheck on the file lists them all`);
  const context = `stringcheck (the Stringless floor checks) found ${found.length} problem(s) in ${file} after this edit:\n${lines.join('\n')}\n` +
    'A finding that is intended can be waived with a "stringcheck-disable <rule>: <reason>" comment on the line above it.';
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } }));
}

function session(input) {
  // Walk up to the repository root, looking where the skill keeps the lexicon: the root, then docs/.
  let dir = resolve(input.cwd || process.cwd());
  for (let i = 0; i < 8; i++) {
    for (const p of [join(dir, 'LEXICON.md'), join(dir, 'docs', 'LEXICON.md')]) {
      if (existsSync(p) && readFileSync(p, 'utf8').slice(0, 4000).includes('stringless:lexicon')) {
        process.stdout.write(`This project uses Stringless. ${p} records its world, materials, verbs and phases, and new or changed UI controls here follow the stringless skill and that lexicon.`);
        return;
      }
    }
    const up = dirname(dir);
    if (existsSync(join(dir, '.git')) || up === dir) return;
    dir = up;
  }
}

try {
  if (!/^(0|off|false|no)$/i.test(process.env.STRINGLESS_HOOK || '')) {
    const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
    if (process.argv[2] === 'post-edit') postEdit(input);
    else if (process.argv[2] === 'session') session(input);
  }
} catch { /* stay silent */ }
