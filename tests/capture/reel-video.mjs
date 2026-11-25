// Records one loop of the showcase reel and encodes it with ffmpeg.
// Serve site/dist, then: $env:BASE='http://127.0.0.1:4180/'; $env:SITE='./'; node tests/cdp.mjs tests/capture/reel-video.mjs
// Env: SCENES=0,2,5 (the loop), WEBP=<out.webp> (README, 720 wide), MP4=<out.mp4> (sharing, full size).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export default async (p) => {
  const site = process.env.SITE || 'site/dist/';
  const scenes = process.env.SCENES || '0,2,5';
  const first = Number(scenes.split(',')[0]);
  const dir = resolve('tests/shots/reel-frames');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  await p.viewport(1920, 1200);

  const frames = [];
  let n = 0;
  let on = true;
  p.c.on((m) => {
    if (m.method !== 'Page.screencastFrame') return;
    const { data, metadata, sessionId } = m.params;
    p.c.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (!on) return;
    const file = join(dir, `f${String(n++).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ ts: metadata.timestamp, file });
  });
  await p.c.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await p.c.send('Page.navigate', { url: p.url(site) + `?record&scenes=${scenes}` });

  // Start when the first scene's frame goes live; stop when the loop comes back to it.
  // Frame timestamps come from Chrome's clock, so the cut points are taken from the frames themselves.
  const firstId = ['delete', 'save', 'private', 'choose', 'suggest', 'export'][first];
  let liveAt = -1;
  let left = false;
  const t0 = Date.now();
  for (;;) {
    await p.sleep(50);
    if (Date.now() - t0 > 150000) throw new Error('the reel did not loop');
    const s = await p.eval(`window.__reel ? { id: window.__reel.scene, live: !!document.querySelector('.screen iframe.live') } : null`).catch(() => null);
    if (!s) continue;
    if (liveAt < 0) { if (s.live) liveAt = frames.length; continue; }
    if (s.id !== firstId) left = true;
    else if (left) break;
  }
  on = false;
  if (!frames[liveAt]) throw new Error('no frames after the first scene went live');
  // Skip the first scene's fade-in, so the loop never shows a black frame.
  const start = frames[liveAt].ts + 0.7;
  const end = frames[frames.length - 1].ts;
  await p.c.send('Page.stopScreencast');
  const st = await p.eval(`(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) & ~1, h: Math.round(r.height) & ~1 }; })()`);

  const kept = frames.filter((f) => f.ts >= start - 0.05 && f.ts <= end);
  const list = kept.map((f, i) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${Math.max(0.001, ((kept[i + 1] ? kept[i + 1].ts : f.ts + 0.1) - f.ts)).toFixed(4)}`).join('\n');
  const txt = join(dir, 'frames.txt');
  writeFileSync(txt, 'ffconcat version 1.0\n' + list + `\nfile '${kept[kept.length - 1].file.replace(/\\/g, '/')}'\n`);
  p.expect(kept.length > 100, `recorded ${kept.length} frames over ${(end - start).toFixed(1)} s`);
  const crop = `crop=${st.w}:${st.h}:${st.x}:${st.y}`;
  const run = (args) => {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', txt, ...args], { encoding: 'utf8' });
    if (r.status !== 0) console.log(r.stderr);
    return r.status === 0;
  };
  if (process.env.WEBP) {
    const ok = run(['-vf', `${crop},fps=15,scale=720:-2:flags=lanczos`, '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', process.env.Q || '80', '-compression_level', '6', '-loop', '0', resolve(process.env.WEBP)]);
    p.expect(ok, 'encoded ' + process.env.WEBP);
  }
  if (process.env.MP4) {
    const ok = run(['-vf', `${crop},fps=30,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', resolve(process.env.MP4)]);
    p.expect(ok, 'encoded ' + process.env.MP4);
  }
};
