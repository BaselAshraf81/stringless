// Dev aid: film parts of the showcase and lay the frames out on one contact sheet.
// $env:BASE='http://127.0.0.1:4180/'; $env:SITE='./'; node tests/cdp.mjs tests/capture/reel-frames.mjs
// Env: FILM=hero (the wordmark's first seconds) or FILM=scenes with SCENES=0,3 (scene openings).
// Writes tests/shots/reel-sheet.png, plus tests/shots/site-full.jpeg (the whole page, 1280 wide).
export default async (p) => {
  const page = process.env.SITE || 'site/dist/';
  const film = process.env.FILM || 'scenes';
  const W = Number(process.env.WIDTH || 1280);
  const Hv = Number(process.env.HEIGHT || 800);
  const frames = [];
  const grab = async (label, clip, scale) => {
    const r = await p.c.send('Page.captureScreenshot', { format: 'jpeg', quality: 75, clip: { ...clip, scale } });
    frames.push({ label, data: r.data });
  };
  await p.viewport(W, Hv, W < 720);

  if (film === 'hero') {
    await p.c.send('Page.navigate', { url: p.url(page) });
    const t0 = Date.now();
    const times = (process.env.TIMES || '300,500,700,900,1100,1300,1450,1600,1750,1900,2100,2400').split(',').map(Number);
    for (const t of times) {
      const lag = t - (Date.now() - t0);
      if (lag > 0) await p.sleep(lag);
      const cl = (process.env.CLIP || '').split(',').map(Number);
      const clip = cl.length === 5 ? { x: cl[0], y: cl[1], width: cl[2], height: cl[3] } : { x: 0, y: 0, width: W, height: Math.min(Hv, W < 720 ? 420 : 340) };
      await grab(`${Date.now() - t0} ms`, clip, cl.length === 5 ? cl[4] : W < 720 ? 0.8 : 0.5);
    }
  } else {
    await p.goto(page);
    await p.sleep(3000);
    const h = await p.eval(`document.documentElement.scrollHeight`);
    const r = await p.c.send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: 1 } });
    (await import('node:fs')).writeFileSync('tests/shots/site-full.jpeg', Buffer.from(r.data, 'base64'));
    const scenes = (process.env.SCENES || '0').split(',').map(Number);
    const times = (process.env.TIMES || '250,600,950,1300,1650,2000,2350,2700,3050,3400').split(',').map(Number);
    for (const i of scenes) {
      const st = await p.eval(`(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: Math.min(r.height, innerHeight - r.top) }; })()`);
      await p.eval(`window.__reel.go(${i}), true`);
      const t0 = Date.now();
      for (const t of times) {
        const lag = t - (Date.now() - t0);
        if (lag > 0) await p.sleep(lag);
        await grab(`scene ${i} at ${Date.now() - t0} ms`, st, 0.4);
      }
      await p.sleep(400);
    }
  }

  await p.goto('about:blank');
  const cols = Number(process.env.COLS || 4);
  const html = `<style>body{margin:0;background:#111;font:12px system-ui;color:#ccc;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}
    figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 0}</style>` +
    frames.map((f) => `<figure><img src="data:image/jpeg;base64,${f.data}"><figcaption>${f.label}</figcaption></figure>`).join('');
  await p.eval(`document.open(); document.write(${JSON.stringify(html)}); document.close(); true`);
  await p.viewport(1700, 800);
  await p.sleep(500);
  const h = await p.eval(`document.documentElement.scrollHeight`);
  await p.viewport(1700, h);
  await p.sleep(300);
  await p.shot('reel-sheet');
  p.expect(frames.length > 0, `captured ${frames.length} frames`);
};
