// Dev aid: frame times for each reel scene and each example, with CPU throttling like the audit asks.
// Serve site/dist, then: $env:BASE='http://127.0.0.1:4180/'; $env:SITE='./'; $env:CPU='4'; node tests/cdp.mjs tests/capture/perf.mjs
// Env: CPU=<throttle rate>, MODE=reel|examples|both, SECONDS=<per sample>.
const recorder = `(() => {
  const w = window;
  w.__perf = { frames: [], loaf: [], on: false };
  const loop = (ts) => { if (w.__perf.on) w.__perf.frames.push(ts); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      if (!w.__perf.on) return;
      for (const e of list.getEntries()) w.__perf.loaf.push({ d: Math.round(e.duration), b: Math.round(e.blockingDuration || 0),
        style: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0),
        scripts: (e.scripts || []).map((s) => (s.invoker || '') + ' ' + Math.round(s.duration)).slice(0, 3) });
    }).observe({ type: 'long-animation-frame', buffered: false });
  } catch (e) {}
  return true;
})()`;

const stats = (frames) => {
  const iv = [];
  for (let i = 1; i < frames.length; i++) iv.push(frames[i] - frames[i - 1]);
  iv.sort((a, b) => a - b);
  const q = (p) => (iv.length ? iv[Math.min(iv.length - 1, Math.floor(p * iv.length))] : 0);
  const span = frames.length > 1 ? frames[frames.length - 1] - frames[0] : 1;
  return { fps: Math.round(((frames.length - 1) / span) * 1000), p50: q(0.5).toFixed(1), p95: q(0.95).toFixed(1), max: (iv[iv.length - 1] || 0).toFixed(0), slow: Math.round((iv.filter((v) => v > 25).length / (iv.length || 1)) * 100) };
};

export default async (p) => {
  const site = process.env.SITE || 'site/dist/';
  const cpu = Number(process.env.CPU || 4);
  const secs = Number(process.env.SECONDS || 5);
  const modeSel = process.env.MODE || 'both';
  await p.c.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await p.c.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const sample = async (label, during) => {
    await p.eval(`window.__perf.frames = []; window.__perf.loaf = []; window.__perf.on = true; true`);
    const m0 = await metrics();
    await during();
    const m1 = await metrics();
    const r = await p.eval(`(() => { window.__perf.on = false; return { frames: window.__perf.frames, loaf: window.__perf.loaf }; })()`);
    const s = stats(r.frames);
    const el = m1.Timestamp - m0.Timestamp;
    const pct = (k) => Math.round(((m1[k] - m0[k]) / el) * 100);
    const worst = r.loaf.sort((a, b) => b.d - a.d)[0];
    console.log(`  ${label.padEnd(26)} fps ${String(s.fps).padStart(3)}  p50 ${s.p50.padStart(5)}  p95 ${s.p95.padStart(5)}  max ${s.max.padStart(4)}  slow ${String(s.slow).padStart(3)}%  main ${String(pct('TaskDuration')).padStart(3)}%  script ${String(pct('ScriptDuration')).padStart(3)}%  style ${String(pct('RecalcStyleDuration')).padStart(2)}%  layout ${String(pct('LayoutDuration')).padStart(2)}%  long ${r.loaf.length}${worst ? ` (worst ${worst.d} ms: ${worst.scripts.join(' | ')})` : ''}`);
    return s;
  };

  await p.viewport(1280, 800);
  await p.c.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  console.log(`CPU throttle ${cpu}x, ${secs} s per sample`);

  if (modeSel !== 'examples') {
    await p.goto(site);
    await p.sleep(400);
    await p.eval(recorder);
    await sample('hero intro', () => p.sleep(2600));
    for (let i = 0; i < 6; i++) {
      await p.eval(`window.__reel.go(${i}), true`);
      await p.sleep(1500);
      const id = await p.eval(`window.__reel.scene`);
      await sample(`reel ${id}`, () => p.sleep(secs * 1000));
    }
    // A visitor's pointer over the page: the wake of light.
    await p.eval(`window.scrollTo(0, 900), true`);
    await p.sleep(400);
    await sample('page wake (mouse)', async () => {
      for (let k = 0; k < secs * 60; k++) { await p.c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640 + Math.cos(k / 9) * 420, y: 400 + Math.sin(k / 7) * 260 }); await p.sleep(16); }
    });
  }

  if (modeSel !== 'reel') {
    for (const ex of ['ember-delete', 'wet-ink-save', 'frost-privacy', 'marble-choice', 'vapor-suggest', 'paper-export']) {
      await p.goto(`${site}examples/${ex}`);
      await p.sleep(900);
      await p.eval(recorder);
      // Sweep a real pointer across the page, the way a visitor scans it.
      await sample(`example ${ex}`, async () => {
        for (let k = 0; k < secs * 60; k++) { await p.c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640 + Math.cos(k / 11) * 460, y: 380 + Math.sin(k / 8) * 250 }); await p.sleep(16); }
      });
    }
  }
  await p.c.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  p.expect(true, 'measured');
};
