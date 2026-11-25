/* Stringless showcase.
 * The stage plays the six live examples. Each scene opens with the old labeled button hanging on a
 * string; the string snaps, the label falls away, and a ghost pointer uses the stringless control.
 * Any real pointer, touch or key inside the stage hands it to the visitor. */
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  if (!stage) return;
  const screenEl = stage.querySelector('.screen');
  const overlay = stage.querySelector('.overlay');
  const ghost = overlay.querySelector('.ghost');
  const trail = overlay.querySelector('.trail');
  const sceneButtons = [...document.querySelectorAll('.scenes button')];
  const takeButton = document.querySelector('.take');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  if (params.has('record')) document.documentElement.classList.add('record');

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const now = () => performance.now();
  class Cancel extends Error {}

  const MOBILE = { w: 430, h: 860 };
  const scenes = [
    // Extensionless paths: the host would answer page.html with a redirect, which costs a round trip per switch.
    { id: 'delete', src: 'examples/ember-delete', size: [1000, 600], anchor: '.card:nth-child(2)', label: 'Delete', kind: 'danger', ms: 11000, play: playDelete },
    { id: 'save', src: 'examples/wet-ink-save', size: [1000, 600], anchor: '.blotter', label: 'Save', kind: 'primary', ms: 11000, play: playSave },
    { id: 'private', src: 'examples/frost-privacy', size: [960, 576], anchor: '.photo', label: 'Private', kind: 'switch', ms: 10500, play: playPrivate },
    { id: 'choose', src: 'examples/marble-choice', size: [1000, 600], anchor: '.tray', label: 'Shipping: Standard', kind: 'select', ms: 10500, play: playChoose },
    { id: 'suggest', src: 'examples/vapor-suggest?embed', size: [960, 576], anchor: '.field', label: 'Accept suggestion', kind: 'ai', ms: 10500, play: playSuggest },
    { id: 'export', src: 'examples/paper-export?embed', size: [1200, 720], anchor: '.slot', label: 'Export CSV', kind: 'neutral', ms: 14000, play: playExport }
  ];

  // ?scenes=0,2,5 plays only those scenes, in that order.
  const order = (() => {
    const list = (params.get('scenes') || '').split(',').filter((v) => /^\d+$/.test(v)).map(Number).filter((n) => n < scenes.length);
    return list.length ? list : scenes.map((_, i) => i);
  })();
  const after = (i) => order[(order.indexOf(i) + 1) % order.length];

  // ------------------------------------------------------------------ slots
  const slots = [0, 1].map(() => {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f._gen = 0;
    screenEl.appendChild(f);
    return f;
  });
  let active = 0;
  let current = 0;
  let run = 0;
  let mode = reduced ? 'manual' : 'auto'; // auto: ghost plays. user: visitor has it. rest: paused. manual: reduced motion.
  let scale = 1;
  let lastUser = 0;
  let inside = false;
  let onScreen = true;

  const designFor = (scene) => (innerWidth < 720 ? MOBILE : { w: scene.size[0], h: scene.size[1] });
  function fit(f, d) {
    f._d = d;
    const s = screenEl.clientWidth / d.w;
    f.style.width = d.w + 'px';
    f.style.height = d.h + 'px';
    f.style.transform = `scale(${s})`;
    if (f === slots[active]) scale = s;
    return s;
  }

  function load(f, scene) {
    return new Promise((resolve, reject) => {
      const gen = ++f._gen;
      const timer = setTimeout(() => reject(new Error('load timeout')), 9000);
      f.onload = () => { if (gen !== f._gen) return; clearTimeout(timer); f.onload = null; resolve(); };
      f._scene = scene;
      fit(f, designFor(scene));
      f.title = 'Live demo: ' + scene.id;
      f.src = scene.src;
    });
  }

  function prepare(f) {
    const win = f.contentWindow;
    const S = win.Stringless;
    if (S) {
      // The ghost must not train the examples' memory, or every loop would get quieter.
      S.config.memory = false;
      S.config.hesitate = mode === 'auto' ? 1e9 : 1600;
      S.fluency.reset();
      S.patina.reset();
    }
    // Browsers send trusted hover updates when content moves under a still pointer.
    // Only real travel (a few pixels from where the pointer was first seen) counts as the visitor.
    let ox = null;
    let oy = null;
    const mark = (e) => {
      if (!e.isTrusted) return;
      if (e.type === 'pointermove') {
        if (ox === null) { ox = e.clientX; oy = e.clientY; return; }
        if (Math.abs(e.clientX - ox) + Math.abs(e.clientY - oy) < 4) return;
      }
      lastUser = now();
      if (e.type === 'pointermove' && e.pointerType !== 'touch') inside = true;
      if (mode === 'auto') takeOver();
    };
    for (const t of ['pointermove', 'pointerdown', 'keydown', 'touchstart']) win.addEventListener(t, mark, { capture: true, passive: true });
    win.addEventListener('mouseout', (e) => { if (e.isTrusted && !e.relatedTarget) { inside = false; lastUser = now(); } });
  }

  // ------------------------------------------------------------------ ghost
  const g = { x: -60, y: -60, down: false, chain: [], win: null, doc: null };
  function bind(f) {
    g.win = f.contentWindow;
    g.doc = g.win.document;
    g.chain = [];
    g.down = false;
  }
  function fire(target, type, x, y, extra) {
    if (!target || !g.win) return;
    const bubbles = type !== 'pointerenter' && type !== 'pointerleave';
    target.dispatchEvent(new g.win.PointerEvent(type, Object.assign({
      bubbles, cancelable: true, composed: true, view: g.win, clientX: x, clientY: y,
      pointerId: 31, pointerType: 'mouse', isPrimary: true, button: -1, buttons: g.down ? 1 : 0
    }, extra)));
  }
  const at = () => (g.doc && g.doc.elementFromPoint(g.x, g.y)) || (g.doc && g.doc.documentElement);
  function hoverAt(x, y) {
    if (!g.doc) return;
    const d = slots[active]._d;
    const el = x >= 0 && y >= 0 && x <= d.w && y <= d.h ? g.doc.elementFromPoint(x, y) : null;
    const next = [];
    for (let n = el; n; n = n.parentElement) next.push(n);
    const keep = new Set(next);
    for (const n of g.chain) if (!keep.has(n)) fire(n, 'pointerleave', x, y);
    const had = new Set(g.chain);
    for (let k = next.length - 1; k >= 0; k--) if (!had.has(next[k])) fire(next[k], 'pointerenter', x, y);
    g.chain = next;
    fire(el || g.doc.documentElement, 'pointermove', x, y);
  }
  function place() {
    const px = g.x * scale;
    const py = g.y * scale;
    ghost.style.translate = `${px.toFixed(1)}px ${py.toFixed(1)}px`;
    drawTrail(px, py);
  }
  async function glide(id, x, y, ms = 700, o = {}) {
    const x0 = g.x;
    const y0 = g.y;
    const dist = Math.hypot(x - x0, y - y0) || 1;
    const nx = -(y - y0) / dist;
    const ny = (x - x0) / dist;
    const bend = (o.bend == null ? 0.1 : o.bend) * dist * (Math.random() < 0.5 ? -1 : 1);
    const t0 = now();
    for (;;) {
      if (id !== run) throw new Cancel();
      const t = Math.min(1, (now() - t0) / ms);
      const e = ease(t);
      const arc = Math.sin(Math.PI * e) * bend;
      g.x = lerp(x0, x, e) + nx * arc;
      g.y = lerp(y0, y, e) + ny * arc;
      place();
      hoverAt(g.x, g.y);
      if (t >= 1) return;
      await frame();
    }
  }
  function press() {
    g.down = true;
    ghost.classList.add('press');
    fire(at(), 'pointerdown', g.x, g.y, { button: 0 });
  }
  function release() {
    g.down = false;
    ghost.classList.remove('press');
    fire(at(), 'pointerup', g.x, g.y, { button: 0 });
  }
  async function tap(id) {
    press();
    await wait(id, 90);
    release();
    let el = at();
    while (el && typeof el.click !== 'function') el = el.parentElement;
    if (el) el.click();
    await wait(id, 40);
  }
  async function follow(id, sel, ms) {
    const t0 = now();
    while (now() - t0 < ms) {
      if (id !== run) throw new Cancel();
      const el = g.doc.querySelector(sel);
      if (el) { const r = el.getBoundingClientRect(); g.x = r.left + r.width / 2; g.y = r.top + r.height / 2; place(); }
      await frame();
    }
  }
  async function wait(id, ms) { await sleep(ms); if (id !== run) throw new Cancel(); }
  async function until(id, fn, ms = 3000) {
    const t0 = now();
    while (!fn()) {
      if (now() - t0 > ms) throw new Error('timed out waiting');
      await wait(id, 80);
    }
  }
  function stopGhost() {
    if (g.doc) {
      try {
        if (g.down) { g.down = false; fire(at(), 'pointerup', g.x, g.y, { button: 0 }); }
        for (const n of g.chain) fire(n, 'pointerleave', -60, -60);
        fire(g.doc.documentElement, 'pointermove', -9999, -9999);
      } catch (e) { /* document went away */ }
    }
    g.chain = [];
    ghost.classList.remove('on', 'press');
    lastP = null;
  }

  // ------------------------------------------------------------------ wake trail behind the ghost
  const tctx = trail.getContext('2d');
  let dpr = 1;
  let lastP = null;
  let idle = 0;
  let fading = 0;
  function sizeTrail() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    trail.width = Math.round(overlay.clientWidth * dpr);
    trail.height = Math.round(overlay.clientHeight * dpr);
  }
  function drawTrail(px, py) {
    const x = px * dpr;
    const y = py * dpr;
    if (lastP && ghost.classList.contains('on')) {
      tctx.globalCompositeOperation = 'lighter';
      tctx.lineCap = 'round';
      tctx.lineWidth = 3 * dpr;
      tctx.strokeStyle = 'rgba(76, 212, 255, .5)';
      tctx.shadowColor = 'rgba(76, 212, 255, .9)';
      tctx.shadowBlur = 10 * dpr;
      tctx.beginPath();
      tctx.moveTo(lastP.x, lastP.y);
      tctx.lineTo(x, y);
      tctx.stroke();
    }
    lastP = { x, y };
    idle = 0;
    if (!fading) fading = requestAnimationFrame(fade);
  }
  function fade() {
    fading = 0;
    tctx.globalCompositeOperation = 'destination-out';
    tctx.shadowBlur = 0;
    tctx.fillStyle = 'rgba(0, 0, 0, .09)';
    tctx.fillRect(0, 0, trail.width, trail.height);
    if (++idle > 70) { tctx.clearRect(0, 0, trail.width, trail.height); return; }
    fading = requestAnimationFrame(fade);
  }

  // ------------------------------------------------------------------ the cut string
  const puppets = new Set();
  function clearPuppets() { for (const p of puppets) p.remove(); puppets.clear(); }
  async function cutString(id, scene) {
    const target = g.doc && g.doc.querySelector(scene.anchor);
    if (!target) return;
    const r = target.getBoundingClientRect();
    const cx = (r.left + r.width / 2) * scale;
    const cy = (r.top + r.height / 2) * scale;
    const H = overlay.clientHeight;
    const puppet = document.createElement('div');
    const top = document.createElement('i');
    const dangler = document.createElement('div');
    const low = document.createElement('i');
    const btn = document.createElement('span');
    puppet.className = 'puppet';
    dangler.className = 'dangler';
    btn.className = 'old ' + scene.kind;
    btn.textContent = scene.label;
    dangler.append(low, btn);
    puppet.append(top, dangler);
    overlay.appendChild(puppet);
    puppets.add(puppet);
    const bh = btn.offsetHeight;
    const hang = Math.max(48, cy - bh / 2);
    const cut = Math.min(hang * 0.4, 90);
    top.style.height = cut + 'px';
    dangler.style.top = cut + 'px';
    low.style.height = hang - cut + 'px';
    btn.style.top = hang - cut + 'px';
    const from = `${cx}px ${-(hang + bh + 40)}px`;
    const to = `${cx}px 0px`;
    puppet.animate([
      { translate: from, rotate: '0deg', easing: 'cubic-bezier(.25,.8,.35,1)' },
      { translate: to, rotate: '0deg', offset: 0.5, easing: 'ease-in-out' },
      { translate: to, rotate: '2.6deg', offset: 0.66, easing: 'ease-in-out' },
      { translate: to, rotate: '-1.7deg', offset: 0.8, easing: 'ease-in-out' },
      { translate: to, rotate: '0.8deg', offset: 0.91, easing: 'ease-in-out' },
      { translate: to, rotate: '0deg' }
    ], { duration: 1300, fill: 'forwards' });
    await wait(id, 1550);
    const dir = Math.random() < 0.5 ? -1 : 1;
    // Fibers spring from the break.
    for (let s = 0; s < 6; s++) {
      const f = document.createElement('b');
      f.className = 'fiber';
      f.style.top = cut + 'px';
      puppet.appendChild(f);
      const a = Math.random() * Math.PI * 2;
      const v = 16 + Math.random() * 26;
      f.animate([
        { translate: '0 0', rotate: `${a}rad`, opacity: 1 },
        { translate: `${(Math.cos(a) * v).toFixed(1)}px ${(Math.sin(a) * v + 22).toFixed(1)}px`, rotate: `${a + 2.4}rad`, opacity: 0 }
      ], { duration: 520 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
    }
    top.animate([{ scale: '1 1' }, { scale: '1 0' }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'forwards' });
    dangler.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: `${dir * 26}px ${H + bh + 160}px`, rotate: `${dir * (18 + Math.random() * 16)}deg` }
    ], { duration: 950, easing: 'cubic-bezier(.45,0,.9,.55)', fill: 'forwards' });
    setTimeout(() => { puppet.remove(); puppets.delete(puppet); }, 1000);
    await wait(id, 300);
  }

  // ------------------------------------------------------------------ scenes
  function ctx(id) {
    const d = slots[active]._d;
    const q = (s) => g.doc.querySelector(s);
    const c = (s, fx = 0.5, fy = 0.5) => {
      const el = typeof s === 'string' ? q(s) : s;
      if (!el) throw new Error('missing ' + s);
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width * fx, y: r.top + r.height * fy, r };
    };
    return {
      d, q, c, win: g.win, doc: g.doc,
      wait: (ms) => wait(id, ms),
      until: (fn, ms) => until(id, fn, ms),
      enter(x, y) { g.x = x; g.y = y; lastP = null; place(); ghost.classList.add('on'); },
      place(x, y) { g.x = x; g.y = y; place(); },
      to: (x, y, ms, o) => glide(id, x, y, ms, o),
      toEl: (s, ms, fx, fy) => { const p = c(s, fx, fy); return glide(id, p.x, p.y, ms); },
      leave: (ms = 700) => glide(id, d.w * (0.3 + Math.random() * 0.4), d.h + 60, ms),
      press, release,
      tap: () => tap(id),
      follow: (s, ms) => follow(id, s, ms),
      key(s, key) { const el = q(s); if (el) el.dispatchEvent(new g.win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); }
    };
  }

  async function playDelete(k) {
    const n = k.c('.card:nth-child(2) .notch');
    k.enter(k.d.w * 0.62, k.d.h + 40);
    await k.to(n.x - 150, n.y + 70, 950);
    await k.wait(250);
    await k.to(n.x - 8, n.y + 10, 600);
    await k.wait(500);
    k.press();
    await k.wait(1450);
    k.release();
    await k.to(n.x - 60, n.y + 120, 500);
    await k.until(() => k.q('.sl-remnant'), 2500);
    await k.wait(900);
    const ash = k.c('.sl-remnant');
    await k.to(ash.x + 30, ash.y + 6, 700);
    await k.wait(400);
    await k.tap();
    await k.wait(1500);
    await k.leave();
  }

  async function playSave(k) {
    const p2 = k.q('.writing p:nth-child(2)');
    const writing = k.q('.writing');
    const endOf = () => {
      const node = p2.lastChild;
      const range = k.doc.createRange();
      const len = node.textContent.length;
      range.setStart(node, Math.max(0, len - 1));
      range.setEnd(node, len);
      const r = range.getBoundingClientRect();
      return { x: r.right + 8, y: r.top + r.height * 0.7 };
    };
    let e = endOf();
    k.enter(e.x + 90, k.d.h + 40);
    await k.to(e.x, e.y, 850);
    await k.wait(250);
    p2.setAttribute('data-wet', '');
    for (const ch of ' And figs.') {
      if (p2.lastChild.nodeType === 3) p2.lastChild.data += ch;
      else p2.append(ch);
      writing.dispatchEvent(new k.win.Event('input', { bubbles: true }));
      e = endOf();
      k.place(e.x, e.y);
      await k.wait(85);
    }
    await k.wait(500);
    const b = k.c('.blotter', 0.5, 0.25);
    await k.to(b.x - 80, b.y + 50, 850);
    await k.to(b.x, b.y, 450);
    await k.wait(650);
    await k.tap();
    await k.follow('.knob', 2500);
    await k.wait(500);
    await k.leave();
  }

  async function playPrivate(k) {
    const gr = k.c('.grip');
    k.enter(k.d.w * 0.35, k.d.h + 40);
    await k.to(gr.x - 150, gr.y + 60, 950);
    await k.wait(300);
    await k.to(gr.x, gr.y, 500);
    await k.wait(950);
    await k.tap();
    await k.wait(900);
    const ph = k.c('.photo').r;
    await k.to(ph.left + ph.width * 0.72, ph.top + ph.height * 0.42, 600);
    await k.to(ph.left + ph.width * 0.3, ph.top + ph.height * 0.58, 1500, { bend: 0.25 });
    await k.wait(300);
    await k.to(ph.left + ph.width * 0.5, ph.bottom + 110, 700);
    await k.wait(1300);
    await k.leave(500);
  }

  async function playChoose(k) {
    const well = (i) => k.c(`.well-wrap:nth-child(${i}) .well`);
    k.enter(k.d.w * 0.5, k.d.h + 40);
    let w = well(2);
    await k.to(w.x, w.y, 950);
    await k.wait(700);
    await k.tap();
    await k.wait(1100);
    w = well(3);
    await k.to(w.x, w.y, 650);
    await k.wait(550);
    await k.tap();
    await k.wait(1100);
    w = well(1);
    await k.to(w.x, w.y, 900);
    await k.wait(550);
    await k.tap();
    await k.wait(1500);
    await k.leave();
  }

  async function playSuggest(k) {
    const f = k.c('.field', 0.4, 0.2);
    k.enter(k.d.w * 0.7, k.d.h + 40);
    await k.to(f.x, f.y + 70, 900);
    await k.until(() => k.q('.vapor .w'), 3000);
    const v = k.c('.vapor .w:nth-child(4)');
    await k.to(v.x, v.y, 800);
    const vapor = k.q('.vapor');
    if (vapor) vapor.classList.add('gathering');
    await k.wait(800);
    await k.tap();
    await k.wait(1500);
    await k.until(() => k.q('.vapor .w'), 3000);
    await k.wait(700);
    const v2 = k.c('.vapor .w:nth-child(2)');
    await k.to(v2.x - 50, v2.y + 8, 600);
    await k.wait(200);
    k.key('#reply', 'Escape');
    await k.to(v2.x + 170, v2.y - 30, 450, { bend: 0.05 });
    await k.wait(900);
    await k.leave();
  }

  async function playExport(k) {
    k.enter(k.d.w * 0.2, k.d.h + 40);
    await k.toEl('.stock[data-k="csv"]', 950);
    await k.wait(350);
    await k.tap();
    await k.wait(500);
    const s = k.c('.slot');
    await k.to(s.x - 60, s.y + 80, 700);
    await k.wait(200);
    await k.to(s.x, s.y, 450);
    await k.wait(950);
    await k.tap();
    await k.wait(1900);
    await k.toEl('.stock[data-k="png"]', 950);
    await k.wait(300);
    await k.tap();
    await k.wait(400);
    await k.toEl('.slot', 800);
    await k.wait(850);
    await k.tap();
    await k.wait(1900);
    await k.leave();
  }

  // ------------------------------------------------------------------ the reel
  function markScene(i) { sceneButtons.forEach((b, k) => b.setAttribute('aria-current', String(k === i))); }
  function setBurning(on, ms) {
    sceneButtons.forEach((b) => b.classList.remove('burning'));
    const b = sceneButtons[current];
    if (!on || !b) return;
    b.style.setProperty('--dur', ms + 'ms');
    void b.offsetWidth;
    b.classList.add('burning');
  }
  function interactive(f, yes) {
    if (yes) { f.removeAttribute('aria-hidden'); f.tabIndex = 0; }
    else { f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; }
  }

  // Two tokens. `swap` belongs to scene switches: only a newer pick may cancel one.
  // `run` belongs to the ghost: a visitor reaching in cancels the ghost, never the switch they asked for.
  let swap = 0;
  async function go(index) {
    const sid = ++swap;
    run++;
    current = (index + scenes.length) % scenes.length;
    const scene = scenes[current];
    markScene(current);
    setBurning(false);
    stopGhost();
    clearPuppets();
    const f = slots[1 - active];
    try {
      await load(f, scene);
    } catch (err) {
      if (sid !== swap) return;
      console.warn('[stringless reel]', scene.id, err && err.message);
      await sleep(800);
      if (sid === swap && mode === 'auto') go(after(current));
      return;
    }
    if (sid !== swap) return;
    prepare(f);
    const old = slots[active];
    f.classList.add('live');
    old.classList.remove('live');
    interactive(old, false);
    const oldGen = old._gen;
    setTimeout(() => { if (old._gen === oldGen && !old.classList.contains('live')) { old.onload = null; old.src = 'about:blank'; } }, 800);
    active = 1 - active;
    fit(f, designFor(scene));
    bind(f);
    if (mode !== 'auto') { interactive(f, true); return; }
    const id = ++run;
    try {
      interactive(f, false);
      await wait(id, 700);
      setBurning(true, scene.ms);
      await cutString(id, scene);
      await scene.play(ctx(id));
      ghost.classList.remove('on');
      await wait(id, 700);
      if (id === run && mode === 'auto') go(after(current));
    } catch (err) {
      if (err instanceof Cancel || id !== run) return;
      console.warn('[stringless reel]', scene.id, err && err.message);
      stopGhost();
      await sleep(800);
      if (id === run && mode === 'auto') go(after(current));
    }
  }

  function pause(to) {
    run++;
    mode = to;
    stopGhost();
    clearPuppets();
    setBurning(false);
  }
  function takeOver() {
    if (mode !== 'auto') return;
    pause('user');
    stage.classList.add('yours');
    const f = slots[active];
    interactive(f, true);
    const S = f.contentWindow && f.contentWindow.Stringless;
    if (S) S.config.hesitate = 1600;
  }

  setInterval(() => {
    if (mode !== 'user' || inside || !onScreen || document.hidden) return;
    if (document.activeElement === slots[active]) return;
    if (now() - lastUser < 5000) return;
    mode = 'auto';
    stage.classList.remove('yours');
    go(after(current));
  }, 500);

  sceneButtons.forEach((b, i) => b.addEventListener('click', () => {
    if (mode !== 'manual') { mode = 'auto'; stage.classList.remove('yours'); }
    go(i);
  }));
  if (takeButton) takeButton.addEventListener('click', () => {
    takeOver();
    lastUser = now();
    const f = slots[active];
    interactive(f, true);
    f.focus();
  });
  slots.forEach((f) => f.addEventListener('focus', () => { lastUser = now(); if (mode === 'auto') takeOver(); }));

  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (!onScreen && mode === 'auto') pause('rest');
    else if (onScreen && mode === 'rest' && !document.hidden) { mode = 'auto'; go(current); }
  }, { threshold: 0.2 }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'auto') pause('rest');
    else if (!document.hidden && mode === 'rest' && onScreen) { mode = 'auto'; go(current); }
  });

  let wasMobile = innerWidth < 720;
  addEventListener('resize', () => {
    for (const f of [slots[1 - active], slots[active]]) if (f._scene) fit(f, designFor(f._scene));
    sizeTrail();
    const mobile = innerWidth < 720;
    if (mobile !== wasMobile) {
      wasMobile = mobile;
      if (mode === 'rest') return;
      if (mode === 'user') { mode = 'auto'; stage.classList.remove('yours'); }
      go(current);
    }
  });

  if (mode === 'manual') stage.classList.add('yours');
  sizeTrail();
  go(order[0]);

  // Test hook: the current scene and mode.
  window.__reel = { get scene() { return scenes[current].id; }, get mode() { return mode; }, go: (i) => go(i) };
})();

/* The wordmark arrives on a red string tied to the dot of its i. The string lets go and the word stays. */
(() => {
  const h1 = document.getElementById('title');
  const intro = h1 && h1.parentElement;
  if (!intro || !h1.firstChild || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => setTimeout(start, 150));

  // Where the dot of the i sits: draw the glyph offscreen and take its topmost blob of ink.
  function tittle() {
    const text = h1.firstChild;
    const at = text.data.indexOf('i');
    const range = document.createRange();
    range.setStart(text, at);
    range.setEnd(text, at + 1);
    const box = range.getBoundingClientRect();
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    h1.appendChild(probe);
    const baseline = probe.getBoundingClientRect().top;
    probe.remove();
    const cs = getComputedStyle(h1);
    const size = parseFloat(cs.fontSize);
    const guess = { x: box.left + box.width / 2, y: baseline - size * 0.74 };
    try {
      const pad = Math.ceil(size * 0.2);
      const w = Math.ceil(box.width + pad * 2);
      const h = Math.ceil(size * 1.3);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      x.fillText('i', pad, size);
      const px = x.getImageData(0, 0, w, h).data;
      let top = -1;
      let sum = 0;
      let n = 0;
      let y = 0;
      for (; y < h; y++) {
        let ink = 0;
        for (let i = 0; i < w; i++) if (px[(y * w + i) * 4 + 3] > 100) { ink++; sum += i; }
        if (ink) { if (top < 0) top = y; n += ink; } else if (top >= 0) break;
      }
      if (top < 0 || !n || y - top > size * 0.2) return guess;
      return { x: box.left + sum / n - pad, y: baseline + (top + y) / 2 - size };
    } catch (e) { return guess; }
  }

  function start() {
    const hr = h1.getBoundingClientRect();
    if (hr.bottom < 0 || hr.top > innerHeight) return;
    const ir = intro.getBoundingClientRect();
    const dot = tittle();
    const W = 360;
    const H = Math.ceil(dot.y + 90);
    const left = Math.min(dot.x - W / 2, innerWidth - W);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.className = 'snap';
    cv.setAttribute('aria-hidden', 'true');
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.cssText = `left:${(left - ir.left).toFixed(1)}px;top:${(-ir.top).toFixed(1)}px;width:${W}px;height:${H}px`;
    intro.appendChild(cv);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);

    const ax = dot.x - left;
    const ay = dot.y;
    const top0 = -30;
    const N = 30;
    const seg = (ay - top0) / (N - 1);
    const P = Array.from({ length: N }, (_, k) => ({ x: ax, y: top0 + seg * k, ox: ax, oy: top0 + seg * k }));
    const fibers = [];
    const DROP = 650;
    const HOLD = 480;
    const t0 = performance.now();
    let pin = { x: ax, y: top0 };
    let tied = true;
    let tSnap = 0;

    function snap(now) {
      tied = false;
      tSnap = now;
      // The cut end flicks up, and a few fibers spring from the break.
      for (let k = 0; k < N; k++) { const f = k / (N - 1); P[k].oy = P[k].y + 10 * f * f; }
      for (let s = 0; s < 7; s++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.8;
        const v = 1.4 + Math.random() * 2.6;
        fibers.push({ x: ax, y: ay, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: Math.random() * 6.28, l: 3 + Math.random() * 5, life: 1 });
      }
    }

    function step(now) {
      const t = now - t0;
      const reach = t < DROP ? 1 - Math.pow(1 - t / DROP, 3) : 1;
      if (tied && t >= DROP + HOLD) snap(now);
      if (!tied) {
        const u = Math.min(1, (now - tSnap) / 700);
        pin = { x: ax + 60 * u * u, y: top0 - 560 * u * u };
      }
      if (reach >= 1) {
        for (const p of P) {
          const vx = (p.x - p.ox) * 0.985;
          const vy = (p.y - p.oy) * 0.985;
          p.ox = p.x;
          p.oy = p.y;
          p.x += vx;
          p.y += vy + (tied ? 0 : 0.35);
        }
        for (let it = 0; it < 12; it++) {
          P[0].x = pin.x;
          P[0].y = pin.y;
          if (tied) { P[N - 1].x = ax; P[N - 1].y = ay; }
          for (let k = 0; k < N - 1; k++) {
            const a = P[k];
            const b = P[k + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 1e-6;
            const diff = (d - seg * 0.97) / d / 2;
            a.x += dx * diff; a.y += dy * diff;
            b.x -= dx * diff; b.y -= dy * diff;
          }
        }
        P[0].x = pin.x;
        P[0].y = pin.y;
      }

      g.clearRect(0, 0, W, H);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = '#ff4b3e';
      g.shadowColor = 'rgba(255, 75, 62, .75)';
      g.shadowBlur = 6;
      g.lineWidth = 2;
      g.beginPath();
      if (reach < 1) {
        g.moveTo(ax, top0);
        g.lineTo(ax, top0 + (ay - top0) * reach);
      } else {
        g.moveTo(P[0].x, P[0].y);
        for (let k = 1; k < N - 1; k++) g.quadraticCurveTo(P[k].x, P[k].y, (P[k].x + P[k + 1].x) / 2, (P[k].y + P[k + 1].y) / 2);
        g.lineTo(P[N - 1].x, P[N - 1].y);
      }
      g.stroke();
      g.lineWidth = 1.4;
      for (let s = fibers.length - 1; s >= 0; s--) {
        const f = fibers[s];
        f.life -= 0.03;
        if (f.life <= 0) { fibers.splice(s, 1); continue; }
        f.vy += 0.12;
        f.x += f.vx;
        f.y += f.vy;
        f.a += 0.22;
        g.globalAlpha = f.life;
        g.beginPath();
        g.moveTo(f.x, f.y);
        g.lineTo(f.x + Math.cos(f.a) * f.l, f.y + Math.sin(f.a) * f.l);
        g.stroke();
      }
      g.globalAlpha = 1;
      if ((!tied && !fibers.length && P.every((p) => p.y < -12)) || t > 5000) { cv.remove(); return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
})();

/* Copy buttons: a cyan carbon copy lifts off and the command goes to the clipboard. */
(() => {
  for (const b of document.querySelectorAll('.cmd')) {
    b.addEventListener('click', async () => {
      const code = b.querySelector('code');
      const text = code.textContent;
      try { await navigator.clipboard.writeText(text); } catch (e) {
        const r = document.createRange();
        r.selectNodeContents(code);
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
        document.execCommand('copy');
        s.removeAllRanges();
      }
      b.classList.add('copied');
      clearTimeout(b._t);
      b._t = setTimeout(() => b.classList.remove('copied'), 1800);
      if (window.Stringless) {
        const r = b.getBoundingClientRect();
        Stringless.verbs.travel(b, { x: r.left + r.width / 2 + 30, y: r.top - 40 }, { scale: 0.92, arc: 0.1, duration: 650 });
        Stringless.announce('Copied.');
      }
    });
  }
})();

/* The page is a dark sea: a real pointer leaves a short-lived wake of light. */
(() => {
  const c = document.getElementById('wake');
  if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = c.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const size = () => { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); };
  size();
  addEventListener('resize', size);
  const sparks = [];
  let raf = 0;
  let last = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const px = e.clientX * dpr;
    const py = e.clientY * dpr;
    if (last) {
      const d = Math.hypot(px - last.x, py - last.y);
      const n = Math.min(5, Math.floor(d / (16 * dpr)));
      for (let i = 0; i < n; i++) {
        const t = Math.random();
        sparks.push({
          x: last.x + (px - last.x) * t + (Math.random() - 0.5) * 12 * dpr,
          y: last.y + (py - last.y) * t + (Math.random() - 0.5) * 12 * dpr,
          r: (0.8 + Math.random() * 1.8) * dpr,
          vx: (Math.random() - 0.5) * 0.25 * dpr,
          vy: (Math.random() - 0.5) * 0.25 * dpr,
          life: 1
        });
      }
      if (sparks.length > 360) sparks.splice(0, sparks.length - 360);
    }
    last = { x: px, y: py };
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  addEventListener('pointerout', (e) => { if (!e.relatedTarget) last = null; });
  function tick() {
    raf = 0;
    x.clearRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= 0.016;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.x += s.vx;
      s.y += s.vy;
      x.fillStyle = `rgba(76, 212, 255, ${(s.life * s.life * 0.5).toFixed(3)})`;
      x.beginPath();
      x.arc(s.x, s.y, s.r, 0, 6.283);
      x.fill();
    }
    if (sparks.length) raf = requestAnimationFrame(tick);
  }
})();
