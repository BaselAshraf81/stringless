// Touch: each verb introduces itself once, long press shows the caption above the finger without
// committing or selecting text, and two taps commit a heavy control.
const touch = async (p, type, x, y) => p.c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
const tap = async (p, x, y) => { await touch(p, 'touchStart', x, y); await p.sleep(60); await touch(p, 'touchEnd', x, y); };

export default async (p) => {
  await p.viewport(390, 844, true);
  await p.goto('skills/stringless/assets/examples/ember-delete.html');
  p.expect(await p.eval(`matchMedia('(hover: none) and (pointer: coarse)').matches`), 'the page sees a touch screen');
  await p.sleep(700);
  p.expect(await p.eval(`[...document.querySelectorAll('.notch')].filter((n) => n.getAnimations().length).length`) === 1, 'the delete verb introduces itself once on first view');

  const cards = `document.querySelectorAll('main > .card:not([hidden])').length`;
  const n = await p.center('.card:nth-child(1) .notch');
  await tap(p, n.x - 6, n.y + 6);
  await p.sleep(400);
  const armed = await p.eval(`+getComputedStyle(document.querySelector('.card:nth-child(1)')).getPropertyValue('--sl-hold')`);
  p.expect(armed > 0.1 && await p.eval(cards) === 3, `one tap chars the corner and waits (${armed.toFixed(2)})`);
  await tap(p, n.x - 6, n.y + 6);
  let left = 3;
  for (let t = 0; t < 30 && left !== 2; t++) { await p.sleep(100); left = await p.eval(cards); }
  p.expect(left === 2, 'a second tap burns it');

  await p.goto('skills/stringless/assets/examples/wet-ink-save.html');
  await p.sleep(400);
  const b = await p.center('.blotter');
  await touch(p, 'touchStart', b.x, b.y);
  await p.sleep(900);
  const cap = await p.eval(`(() => { const c = document.querySelector('.sl-caption'); if (!c) return null; return { text: c.textContent, bottom: c.getBoundingClientRect().bottom, top: document.querySelector('.blotter').getBoundingClientRect().top }; })()`);
  await touch(p, 'touchEnd', b.x, b.y);
  await p.sleep(500);
  p.expect(!!cap && cap.text === 'Save note' && cap.bottom <= cap.top + 1, 'a long press shows the caption above the finger');
  p.expect(await p.eval(`document.querySelectorAll('p[data-wet]').length`) > 0, 'the long press does not save');
  p.expect(await p.eval(`String(getSelection())`) === '', 'the long press selects no text');
};
