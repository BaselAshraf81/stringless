// The showcase: every reel scene plays without errors, the visitor can take over, and the page fits a phone.
const scene = () => `window.__reel && window.__reel.scene`;
const mode = () => `window.__reel && window.__reel.mode`;

export default async (p) => {
  const page = process.env.SITE || 'site/dist/';
  await p.viewport(1280, 800);
  await p.goto(page);
  await p.sleep(2300);
  p.expect(await p.eval(`!!document.querySelector('.puppet .old')`), 'scene opens with a labeled button on a string');
  await p.shot('site-cut');
  await p.sleep(3200);
  p.expect(await p.eval(`document.querySelector('.ghost').classList.contains('on')`), 'the ghost pointer is playing');
  await p.shot('site-delete');

  // The live frame must be the one under the pointer, whichever of the two slots it is in.
  const onTop = `(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === document.querySelector('.screen iframe.live'); })()`;
  const ids = ['delete', 'save', 'private', 'choose', 'suggest', 'export'];
  const covered = [];
  for (let i = 1; i < ids.length; i++) {
    await p.eval(`window.__reel.go(${i}), true`);
    await p.sleep(5200);
    p.expect(await p.eval(scene()) === ids[i], `scene ${ids[i]} plays`);
    if (await p.eval(onTop)) covered.push(ids[i]);
    await p.shot(`site-${ids[i]}`);
  }
  p.expect(covered.length === ids.length - 1, `the pointer reaches the live frame in every scene (${covered.join(', ')})`);
  await p.sleep(13500);
  p.expect(await p.eval(scene()) === 'delete', 'the reel loops back to the first scene');
  const warns = p.logs.filter((l) => l.includes('[stringless reel]'));
  p.expect(warns.length === 0, `no scene failed (${warns.length})`);

  // A real pointer inside the stage hands it to the visitor.
  const st = await p.center('.stage');
  await p.move(st.x - 200, st.y, 6);
  await p.sleep(300);
  p.expect(await p.eval(mode()) === 'user', 'a real pointer takes over the stage');
  p.expect(!(await p.eval(`document.querySelector('.ghost').classList.contains('on')`)), 'the ghost steps aside');
  await p.move(st.x, st.y + 600, 4);
  await p.sleep(6200);
  p.expect(await p.eval(mode()) === 'auto', 'the ghost comes back after the visitor leaves');

  // Picking a scene switches the stage at once, even if the visitor reaches in before it loads.
  if (process.env.LATENCY) {
    await p.c.send('Network.enable');
    await p.c.send('Network.emulateNetworkConditions', { offline: false, latency: Number(process.env.LATENCY), downloadThroughput: -1, uploadThroughput: -1 });
  }
  const live = `((document.querySelector('.screen iframe.live') || {}).src || '')`;
  const waitLive = async (part, ms = 3000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if ((await p.eval(live)).includes(part)) return Date.now() - t0;
      await p.sleep(40);
    }
    return -1;
  };
  const pick = async (name) => { const b = await p.center(`.scenes button:nth-child(${ids.indexOf(name) + 1})`); await p.click(b.x, b.y); };
  await pick('private');
  await p.move(st.x, st.y, 3);
  let took = await waitLive('frost-privacy');
  p.expect(took >= 0, `picking private shows it even when the visitor reaches in at once (${took} ms)`);
  p.expect(await p.eval(mode()) === 'user', 'the visitor has the stage after reaching in');
  await p.sleep(300);
  const grip = await p.eval(`(() => {
    const f = document.querySelector('.screen iframe.live');
    const g = f.contentDocument.querySelector('.grip');
    const r = g.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    const s = fr.width / f.offsetWidth;
    return { x: fr.left + (r.left + r.width / 2) * s, y: fr.top + (r.top + r.height / 2) * s };
  })()`);
  await p.click(grip.x, grip.y);
  await p.sleep(500);
  p.expect(await p.eval(`document.querySelector('.screen iframe.live').contentDocument.querySelector('.grip').getAttribute('aria-checked')`) === 'true', 'the visitor can flip the private switch');

  await pick('suggest');
  took = await waitLive('vapor-suggest');
  p.expect(took >= 0 && took < 1500, `picking suggest switches within 1.5 s (${took} ms)`);
  await p.sleep(3500);
  p.expect(await p.eval(`document.querySelector('.ghost').classList.contains('on')`), 'the ghost plays the picked scene');

  for (const name of ['export', 'save', 'choose']) { await pick(name); await p.sleep(110); }
  took = await waitLive('marble-choice');
  p.expect(took >= 0, `quick picks end on the last one picked (${took} ms)`);
  await p.sleep(1500);
  p.expect((await p.eval(live)).includes('marble-choice') && await p.eval(scene()) === 'choose', 'the stage and the tabs agree');
  if (process.env.LATENCY) await p.c.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  await p.viewport(390, 844, true);
  await p.goto(page);
  await p.sleep(5600);
  const overflow = await p.eval(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  p.expect(overflow <= 0, `no horizontal scroll on a phone (${overflow}px)`);
  await p.shot('site-mobile');
};
