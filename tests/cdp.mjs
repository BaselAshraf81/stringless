// Tiny headless Chrome harness over the DevTools protocol. Node 22+ (global WebSocket), no dependencies.
// usage: node tests/cdp.mjs <scenario.mjs>
// A scenario exports `default async (page) => {}` and calls page.expect(condition, label).
// Env: CHROME=<path to Chrome or Edge>, BASE=<url of the served repo root>, SHOTS=<dir for screenshots>.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = (process.env.BASE || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const SHOTS = resolve(process.env.SHOTS || 'tests/shots');
mkdirSync(SHOTS, { recursive: true });

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ];
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error('No Chrome or Edge found. Set CHROME to its path.');
  return hit;
}

async function launch() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const dir = mkdtempSync(join(tmpdir(), 'sl-cdp-'));
  const proc = spawn(findChrome(), [
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run',
    '--no-default-browser-check', '--window-size=1280,800', '--hide-scrollbars', '--mute-audio', 'about:blank'
  ], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const pg = list.find((t) => t.type === 'page');
      if (pg) return { proc, dir, ws: pg.webSocketDebuggerUrl };
    } catch {}
    await sleep(250);
  }
  proc.kill();
  throw new Error('Chrome did not start');
}

function connect(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const listeners = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: ok, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : ok(msg.result);
      } else if (msg.method) listeners.forEach((l) => l(msg));
    };
    ws.onerror = rej;
    ws.onopen = () => res({
      send(method, params = {}) { const n = ++id; ws.send(JSON.stringify({ id: n, method, params })); return new Promise((ok, reject) => pending.set(n, { resolve: ok, reject })); },
      on(fn) { listeners.push(fn); },
      close() { ws.close(); }
    });
  });
}

const scenarioPath = process.argv[2];
const { proc, dir, ws } = await launch();
const c = await connect(ws);
const logs = [];
let failed = 0;
let passed = 0;
c.on((m) => {
  if (m.method === 'Runtime.consoleAPICalled' && /^(error|warning|assert)$/.test(m.params.type)) logs.push(`[console.${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  if (m.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
});
await c.send('Runtime.enable');
await c.send('Page.enable');
await c.send('Page.setDownloadBehavior', { behavior: 'deny' }).catch(() => null);

const page = {
  c, sleep, logs, base: BASE,
  url(path) { return BASE + path.replace(/^\//, ''); },
  expect(cond, label) {
    if (cond) { passed++; console.log(`  ok    ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}`); }
  },
  async viewport(width, height, mobile = false) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await c.send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
  },
  async reducedMotion(on) { await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] }); },
  async goto(path) {
    await c.send('Page.navigate', { url: /^https?:/.test(path) ? path : page.url(path) });
    await sleep(900);
  },
  async eval(expr) {
    const r = await c.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  },
  async move(x, y, steps = 8) {
    const from = page._m || { x: 5, y: 5 };
    for (let i = 1; i <= steps; i++) {
      await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + ((x - from.x) * i) / steps, y: from.y + ((y - from.y) * i) / steps });
      await sleep(16);
    }
    page._m = { x, y };
  },
  async down() { await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: page._m.x, y: page._m.y, button: 'left', clickCount: 1 }); },
  async up() { await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: page._m.x, y: page._m.y, button: 'left', clickCount: 1 }); },
  async click(x, y) { await page.move(x, y); await page.down(); await sleep(50); await page.up(); },
  async key(key, code, opts = {}) {
    const base = { key, code, windowsVirtualKeyCode: opts.vk || 0, modifiers: opts.modifiers || 0 };
    await c.send('Input.dispatchKeyEvent', { type: opts.text ? 'keyDown' : 'rawKeyDown', ...base, text: opts.text });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  },
  async type(text) { for (const ch of text) { await c.send('Input.insertText', { text: ch }); await sleep(20); } },
  async center(sel) {
    return page.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
  },
  async shot(name, opts = {}) {
    const format = opts.format || 'png';
    const params = { format };
    if (format !== 'png') params.quality = opts.quality || 82;
    if (opts.clip) params.clip = { scale: 1, ...opts.clip };
    const r = await c.send('Page.captureScreenshot', params);
    const file = opts.path ? resolve(opts.path) : join(SHOTS, /\.\w+$/.test(name) ? name : `${name}.${format}`);
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
};

try {
  const mod = await import(pathToFileURL(resolve(scenarioPath)).href);
  await mod.default(page);
} catch (e) {
  failed++;
  console.log('  FAIL  scenario threw: ' + e.message);
} finally {
  const errors = logs.filter((l) => l.startsWith('[exception]') || l.startsWith('[console.error]'));
  if (logs.length) console.log(logs.map((l) => '  log   ' + l).join('\n'));
  if (errors.length) { failed += errors.length; console.log(`  FAIL  ${errors.length} page error(s)`); }
  c.close();
  proc.kill();
  await sleep(300);
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
  console.log(`  ${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
}
