// Captures the README images into docs/images/. Run: node tests/cdp.mjs tests/capture/readme-images.mjs (with serve.mjs on BASE).
import { mkdirSync } from 'node:fs';

const W = 720, H = 450;
const crop = (cx, cy) => ({ x: Math.max(0, Math.round(cx - W / 2)), y: Math.max(0, Math.round(cy - H / 2)), width: W, height: H });
const out = (name) => ({ format: 'webp', quality: 80, path: `docs/images/${name}.webp` });

export default async (p) => {
  mkdirSync('docs/images', { recursive: true });
  await p.viewport(1280, 800);

  await p.goto('skills/stringless/assets/examples/ember-delete.html');
  const n = await p.center('.card:nth-child(2) .notch');
  await p.move(n.x, n.y, 6);
  await p.down();
  await p.sleep(720);
  await p.shot('', { ...out('ember-delete'), clip: crop(640, 300) });
  await p.up();

  await p.goto('skills/stringless/assets/examples/frost-privacy.html');
  const g = await p.center('.grip');
  await p.move(g.x, g.y, 6);
  await p.sleep(800);
  await p.shot('', { ...out('frost-privacy'), clip: crop(640, 300) });

  await p.goto('skills/stringless/assets/examples/marble-choice.html');
  const w3 = await p.center('.well-wrap:nth-child(3) .well');
  await p.move(w3.x, w3.y, 8);
  await p.sleep(650);
  await p.shot('', { ...out('marble-choice'), clip: crop(640, 290) });

  await p.goto('skills/stringless/assets/examples/vapor-suggest.html');
  await p.sleep(1800);
  await p.move(1200, 780, 2);
  await p.shot('', { ...out('vapor-suggest'), clip: crop(640, 260) });

  await p.goto('skills/stringless/assets/examples/paper-export.html');
  const csv = await p.center('.stock[data-k="csv"]');
  await p.click(csv.x, csv.y);
  const s = await p.center('.slot');
  await p.move(s.x, s.y, 6);
  await p.sleep(800);
  await p.shot('', { ...out('paper-export'), clip: crop(640, 380) });

  await p.goto('skills/stringless/assets/examples/wet-ink-save.html');
  const b = await p.center('.blotter');
  await p.move(b.x, b.y, 6);
  await p.sleep(300);
  await p.down(); await p.sleep(50); await p.up();
  await p.sleep(820);
  await p.shot('', { ...out('wet-ink-save'), clip: crop(640, 330) });
  p.expect(true, 'captured six images');
};
