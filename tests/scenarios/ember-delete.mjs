// Direct children only: shards are clones of the card and live in an effect layer inside <main>.
const visibleCards = `document.querySelectorAll('main > .card:not([hidden])').length`;

export default async (p) => {
  await p.viewport(1280, 800);
  await p.goto('skills/stringless/assets/examples/ember-delete.html');
  const n = await p.center('.card:nth-child(2) .notch');
  await p.move(n.x - 60, n.y + 20, 8);
  await p.move(n.x, n.y, 4);
  await p.sleep(300);
  p.expect(await p.eval(`document.querySelector('.card:nth-child(2)').dataset.slPreview`) === 'delete', 'hover rehearses delete on its own card');
  await p.down();
  await p.sleep(500);
  const mid = await p.eval(`+getComputedStyle(document.querySelector('.card:nth-child(2)')).getPropertyValue('--sl-hold')`);
  p.expect(mid > 0.2 && mid < 0.8, `hold progress grows (${mid.toFixed(2)} at 500ms)`);
  await p.shot('ember-hold');
  await p.up();
  await p.sleep(600);
  p.expect(await p.eval(visibleCards) === 3, 'releasing early cools it: the card stays');
  await p.move(n.x, n.y, 2);
  await p.down();
  await p.sleep(1350);
  await p.shot('ember-shatter');
  await p.up();
  await p.sleep(1400);
  p.expect(await p.eval(visibleCards) === 2, 'a full hold burns the card');
  p.expect(await p.eval(`!!document.querySelector('.sl-remnant.ash')`), 'an ash remnant is left in its place');
  p.expect((await p.eval(`document.querySelector('.sl-live').textContent`)).includes('restore'), 'the undo window is announced');
  await p.move(n.x + 260, n.y + 240, 4);
  await p.sleep(300);
  await p.shot('ember-ash');
  const a = await p.center('.sl-remnant');
  await p.click(a.x, a.y);
  await p.sleep(1700);
  p.expect(await p.eval(visibleCards) === 3, 'pressing the ash restores the card');
  p.expect(await p.eval(`document.querySelectorAll('[data-sl-fx]').length`) <= 3, 'effect layers are cleaned up');
  await p.move(100, 100, 4);
  // keyboard: press twice
  await p.eval(`document.querySelector('.card:nth-child(1) .notch').focus()`);
  await p.key('Enter', 'Enter', { vk: 13, text: '\r' });
  await p.sleep(250);
  p.expect(await p.eval(`document.querySelector('.card:nth-child(1) .notch').dataset.slState`) === 'armed', 'first Enter arms');
  p.expect((await p.eval(`document.querySelector('.sl-live').textContent`)).includes('Press again'), 'arming is announced');
  await p.shot('ember-armed');
  await p.key('Escape', 'Escape', { vk: 27 });
  await p.sleep(200);
  p.expect(await p.eval(`document.querySelector('.card:nth-child(1) .notch').dataset.slState`) !== 'armed', 'Escape disarms');
  await p.key('Enter', 'Enter', { vk: 13, text: '\r' });
  await p.sleep(200);
  await p.key('Enter', 'Enter', { vk: 13, text: '\r' });
  // The burn runs about a second; give a loaded machine up to four.
  let left = 3;
  for (let t = 0; t < 40 && left !== 2; t++) { await p.sleep(100); left = await p.eval(visibleCards); }
  p.expect(left === 2, 'second Enter burns');
  await p.reducedMotion(true);
  await p.goto('skills/stringless/assets/examples/ember-delete.html');
  await p.eval(`document.querySelector('.card:nth-child(3) .notch').focus()`);
  await p.key('Enter', 'Enter', { vk: 13, text: '\r' });
  await p.sleep(150);
  await p.key('Enter', 'Enter', { vk: 13, text: '\r' });
  await p.sleep(700);
  p.expect(await p.eval(visibleCards) === 2 && await p.eval(`!!document.querySelector('.sl-remnant')`), 'reduced motion still burns and leaves ash');
};
