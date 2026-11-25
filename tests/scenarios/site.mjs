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

  const ids = ['delete', 'save', 'private', 'choose', 'suggest', 'export'];
  for (let i = 1; i < ids.length; i++) {
    await p.eval(`window.__reel.go(${i}), true`);
    await p.sleep(5200);
    p.expect(await p.eval(scene()) === ids[i], `scene ${ids[i]} plays`);
    await p.shot(`site-${ids[i]}`);
  }
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

  await p.viewport(390, 844, true);
  await p.goto(page);
  await p.sleep(5600);
  const overflow = await p.eval(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  p.expect(overflow <= 0, `no horizontal scroll on a phone (${overflow}px)`);
  await p.shot('site-mobile');
};
