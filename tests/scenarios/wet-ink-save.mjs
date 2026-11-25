export default async (p) => {
  await p.viewport(1280, 800);
  await p.goto('skills/stringless/assets/examples/wet-ink-save.html');
  await p.shot('wet-rest');
  const b = await p.center('.blotter');
  await p.move(b.x - 90, b.y - 30, 10);
  await p.sleep(250);
  p.expect(await p.eval(`document.querySelector('.blotter').dataset.slState`) === 'near', 'approach wakes the blotter (near)');
  await p.move(b.x, b.y, 6);
  await p.sleep(350);
  p.expect(await p.eval(`document.querySelector('.page').dataset.slPreview`) === 'save', 'hover rehearses "save" on the page');
  await p.shot('wet-rehearse');
  await p.down(); await p.sleep(60); await p.up();
  await p.sleep(700);
  await p.shot('wet-commit-mid');
  await p.sleep(1700);
  p.expect(await p.eval(`document.querySelectorAll('p[data-wet]').length`) === 0, 'every wet paragraph dried');
  p.expect(await p.eval(`document.querySelector('.page').dataset.slPhase`) === 'dry', 'page phase is dry');
  p.expect((await p.eval(`document.querySelector('.imprint').textContent`)).includes('walnut honey'), 'felt keeps an imprint of the saved text');
  p.expect((await p.eval(`document.querySelector('.sl-live').textContent`)) === 'Saved.', 'save is announced');
  await p.move(b.x, b.y - 4, 2);
  await p.sleep(1900);
  p.expect(await p.eval(`document.querySelector('.sl-caption') && document.querySelector('.sl-caption').textContent`) === 'Save note', 'hesitation shows the caption "Save note"');
  await p.shot('wet-hesitant');
  await p.move(100, 700, 4);
  // typing makes a paragraph wet again
  await p.eval(`(() => { const p = document.querySelector('.writing p'); const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.querySelector('.writing').focus(); })()`);
  await p.type(' Figs too.');
  await p.sleep(100);
  p.expect(await p.eval(`document.querySelector('.page').dataset.slPhase`) === 'wet', 'typing turns the page wet again');
  // Ctrl+S saves
  await p.key('s', 'KeyS', { vk: 83, modifiers: 2 });
  await p.sleep(1600);
  p.expect(await p.eval(`document.querySelector('.page').dataset.slPhase`) === 'dry', 'Ctrl+S saves');
};
