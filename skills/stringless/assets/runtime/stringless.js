/*! Stringless runtime 0.1.0 | MIT | https://github.com/BaselAshraf81/stringless
 *
 * Zero-dependency helpers for controls that explain themselves without labels.
 * Load as a classic <script>, or `import "./stringless.js"` from a bundler.
 * Everything is driven by data attributes and CSS variables; see reference/runtime.md.
 */
(function (G) {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (G.Stringless && G.Stringless.version) return;

  const VERSION = '0.1.0';
  const doc = document;
  const html = doc.documentElement;
  const CONTROL = '[data-sl-verb]';
  const MATERIAL = '[data-sl-material]';
  const FX = '[data-sl-fx]';
  const NATIVE = 'button, a[href], input, select, textarea, summary, [contenteditable=""], [contenteditable="true"]';
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
  const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;
  const now = () => performance.now();
  const reduced = () => reduceMQ.matches;

  const config = {
    radius: 120,
    hold: 1100,
    armWindow: 4000,
    hesitate: 1600,
    peek: 1800,
    memory: true,
    captionKey: '?',
    armHint: 'Press again to confirm.',
    dev: /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:'
  };

  // ---------------------------------------------------------------- storage
  const store = (() => {
    try { const k = '__sl_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; }
  })();
  const load = (key, fallback) => {
    if (!store) return fallback;
    try { const v = store.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  };
  const save = (key, value) => { if (store && config.memory) try { store.setItem(key, JSON.stringify(value)); } catch (e) { /* full */ } };

  // ---------------------------------------------------------------- css vars
  const varCache = new WeakMap();
  function setVar(el, name, value) {
    let c = varCache.get(el);
    if (!c) { c = Object.create(null); varCache.set(el, c); }
    if (c[name] === value) return;
    c[name] = value;
    el.style.setProperty(name, value);
  }
  function registerProps() {
    if (!(G.CSS && CSS.registerProperty)) return;
    const nums = { '--sl-near': 0, '--sl-rehearse': 0, '--sl-hold': 0, '--sl-intensity': 1, '--sl-fluency': 0, '--sl-wear': 0, '--sl-life': 1 };
    for (const name in nums) {
      try { CSS.registerProperty({ name, syntax: '<number>', inherits: true, initialValue: String(nums[name]) }); } catch (e) { /* already registered by the stylesheet */ }
    }
  }

  // ---------------------------------------------------------------- physics
  const physics = {
    paper: { mass: 0.6, stiffness: 380, damping: 16 },
    ink: { mass: 1.2, stiffness: 160, damping: 30 },
    graphite: { mass: 0.6, stiffness: 420, damping: 32 },
    glass: { mass: 1, stiffness: 900, damping: 18 },
    metal: { mass: 3, stiffness: 400, damping: 60 },
    rubber: { mass: 1, stiffness: 300, damping: 9 },
    clay: { mass: 1.5, stiffness: 120, damping: 30 },
    liquid: { mass: 1.2, stiffness: 150, damping: 8 },
    ice: { mass: 1, stiffness: 600, damping: 40 },
    stone: { mass: 5, stiffness: 500, damping: 95 },
    cloth: { mass: 0.4, stiffness: 60, damping: 6 },
    wax: { mass: 1.5, stiffness: 200, damping: 40 },
    light: { mass: 0.2, stiffness: 200, damping: 12 },
    vapor: { mass: 0.5, stiffness: 30, damping: 8 },
    ember: { mass: 1, stiffness: 200, damping: 28 },
    default: { mass: 1, stiffness: 260, damping: 24 }
  };
  const params = (p) => (typeof p === 'string' ? physics[p] || physics.default : Object.assign({}, physics.default, p || {}));

  function springFn(p) {
    const { mass: m, stiffness: k, damping: c } = params(p);
    const w0 = Math.sqrt(k / m);
    const z = c / (2 * Math.sqrt(k * m));
    if (z < 0.999) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return (t) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    if (z <= 1.001) return (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    const s = Math.sqrt(z * z - 1);
    const r1 = -w0 * (z - s);
    const r2 = -w0 * (z + s);
    const A = -r2 / (r2 - r1);
    const B = -1 - A;
    return (t) => 1 + A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
  }

  const easingCache = new Map();
  /** CSS `linear()` easing and duration (ms) for a spring preset or {mass, stiffness, damping}. */
  function springEasing(p) {
    const key = typeof p === 'string' ? p : JSON.stringify(params(p));
    if (easingCache.has(key)) return easingCache.get(key);
    const f = springFn(p);
    let T = 0.05;
    for (let t = 0; t < 6; t += 1 / 240) if (Math.abs(1 - f(t)) > 0.002) T = t + 1 / 240;
    const n = Math.min(64, Math.max(16, Math.round(T * 50)));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(i === n ? 1 : round(f((i / n) * T), 4));
    const out = { easing: 'linear(' + pts.join(', ') + ')', duration: Math.round(T * 1000) };
    easingCache.set(key, out);
    return out;
  }

  /** Interactive spring for drags and retargeting. onUpdate(value, velocity) runs every frame. */
  function spring(opts = {}) {
    const p = params(opts.physics || opts.material);
    let x = opts.from != null ? opts.from : 0;
    let v = opts.velocity || 0;
    let target = opts.to != null ? opts.to : 1;
    let raf = 0;
    let last = 0;
    let resolve;
    const finished = new Promise((r) => (resolve = r));
    const update = (val, vel) => opts.onUpdate && opts.onUpdate(val, vel);
    const step = (t) => {
      const dt = Math.min(0.064, last ? (t - last) / 1000 : 1 / 60);
      last = t;
      const h = dt / 4;
      for (let i = 0; i < 4; i++) {
        const a = (-p.stiffness * (x - target) - p.damping * v) / p.mass;
        v += a * h;
        x += v * h;
      }
      const scale = Math.max(1, Math.abs(target));
      if (Math.abs(v) < 0.002 * scale && Math.abs(x - target) < 0.0008 * scale) {
        x = target; v = 0; raf = 0; update(x, 0); resolve(x); return;
      }
      update(x, v);
      raf = requestAnimationFrame(step);
    };
    if (reduced() && !opts.ignoreReducedMotion) { x = target; update(x, 0); resolve(x); }
    else raf = requestAnimationFrame(step);
    return {
      get value() { return x; },
      get velocity() { return v; },
      finished,
      retarget(to) { target = to; if (!raf) { last = 0; raf = requestAnimationFrame(step); } },
      stop() { cancelAnimationFrame(raf); raf = 0; resolve(x); }
    };
  }

  // ---------------------------------------------------------------- memory: fluency + patina
  let fluencyData = load('sl:fluency', {});
  let patinaData = load('sl:patina', {});

  function fluencyOf(verb) {
    const f = fluencyData[verb];
    if (!f) return 0;
    return clamp(1 - Math.exp(-(f.uses || 0) / 5) - Math.min(0.5, (f.hesitations || 0) * 0.08));
  }
  function bumpFluency(verb, kind) {
    const f = fluencyData[verb] || (fluencyData[verb] = { uses: 0, hesitations: 0 });
    if (kind === 'use') f.uses++;
    else f.hesitations++;
    save('sl:fluency', fluencyData);
    for (const s of controls.values()) if (s.verb === verb) applyMemory(s);
  }
  function wearOf(id) { const n = patinaData[id] || 0; return n ? clamp(Math.log(1 + n) / Math.log(60)) : 0; }
  function bumpPatina(s) {
    const id = s.el.getAttribute('data-sl-id');
    if (!id) return;
    patinaData[id] = (patinaData[id] || 0) + 1;
    save('sl:patina', patinaData);
    applyMemory(s);
  }
  function intensityOf(s) { return s.hesitant ? 1 : round(1 - 0.6 * fluencyOf(s.verb), 3); }
  function applyMemory(s) {
    setVar(s.el, '--sl-fluency', round(fluencyOf(s.verb), 3));
    setVar(s.el, '--sl-intensity', intensityOf(s));
    const id = s.el.getAttribute('data-sl-id');
    if (id) setVar(s.el, '--sl-wear', round(wearOf(id), 3));
  }

  // ---------------------------------------------------------------- announcer
  let live = null;
  function announce(text) {
    if (!text) return;
    if (!live) {
      live = doc.createElement('div');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('data-sl-fx', '');
      live.className = 'sl-live';
      Object.assign(live.style, { position: 'fixed', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', left: '0', top: '0' });
      doc.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 40);
  }

  // ---------------------------------------------------------------- events
  function emit(el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: Object.assign({ verb: el.getAttribute('data-sl-verb') }, detail || {}) })); }

  // ---------------------------------------------------------------- sound (opt-in)
  const sound = (() => {
    let ctx = null;
    let noise = null;
    let enabled = !!load('sl:sound', false);
    const master = { gain: 0.18 };
    function ensure() {
      if (ctx) return ctx;
      const AC = G.AudioContext || G.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = ctx.sampleRate;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return ctx;
    }
    function env(g, t, a, peak, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * master.gain, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    function burst(t, { type = 'bandpass', freq = 2000, q = 1, a = 0.002, peak = 0.8, dec = 0.08 } = {}) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      env(g, t, a, peak, dec);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t, Math.random() * 0.5, a + dec + 0.05);
    }
    function tone(t, { wave = 'sine', from = 440, to = null, a = 0.003, peak = 0.6, dec = 0.12 } = {}) {
      const o = ctx.createOscillator();
      o.type = wave;
      o.frequency.setValueAtTime(from, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + dec);
      const g = ctx.createGain();
      env(g, t, a, peak, dec);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + a + dec + 0.05);
    }
    const recipes = {
      paper: (t, k) => { burst(t, { freq: 3200, q: 0.7, dec: 0.06 }); if (k === 'commit') burst(t + 0.05, { freq: 2400, q: 0.8, dec: 0.08 }); },
      ink: (t) => { tone(t, { from: 320, to: 180, dec: 0.1, peak: 0.4 }); burst(t, { type: 'lowpass', freq: 900, dec: 0.05, peak: 0.3 }); },
      graphite: (t) => burst(t, { type: 'highpass', freq: 3500, dec: 0.05, peak: 0.4 }),
      glass: (t, k) => { const f = k === 'cancel' ? 1500 : 2300; tone(t, { from: f, dec: 0.45, peak: 0.35 }); tone(t, { from: f * 1.5, dec: 0.3, peak: 0.12 }); },
      metal: (t) => { tone(t, { wave: 'square', from: 180, dec: 0.06, peak: 0.12 }); burst(t, { type: 'highpass', freq: 3000, dec: 0.015, peak: 0.6 }); },
      rubber: (t) => tone(t, { from: 170, to: 70, dec: 0.13, peak: 0.6 }),
      clay: (t) => { burst(t, { type: 'lowpass', freq: 700, dec: 0.08, peak: 0.6 }); tone(t, { from: 120, dec: 0.08, peak: 0.3 }); },
      liquid: (t) => tone(t, { from: 380, to: 980, dec: 0.09, peak: 0.45 }),
      ice: (t) => { tone(t, { from: 2900, dec: 0.08, peak: 0.2 }); burst(t, { type: 'highpass', freq: 5000, dec: 0.03, peak: 0.5 }); },
      stone: (t) => { burst(t, { type: 'lowpass', freq: 380, dec: 0.12, peak: 0.9 }); tone(t, { from: 70, dec: 0.15, peak: 0.5 }); },
      cloth: (t) => burst(t, { freq: 1200, q: 0.5, a: 0.01, dec: 0.12, peak: 0.5 }),
      wax: (t) => { burst(t, { type: 'lowpass', freq: 900, dec: 0.09, peak: 0.6 }); tone(t, { from: 140, dec: 0.08, peak: 0.25 }); },
      light: (t) => { tone(t, { from: 880, dec: 0.2, peak: 0.12 }); tone(t, { from: 1320, dec: 0.2, peak: 0.06 }); },
      vapor: (t) => burst(t, { type: 'lowpass', freq: 600, a: 0.04, dec: 0.25, peak: 0.25 }),
      ember: (t) => { for (let i = 0; i < 6; i++) burst(t + Math.random() * 0.25, { type: 'highpass', freq: 1500, dec: 0.012, peak: 0.5 }); },
      ash: (t) => burst(t, { type: 'lowpass', freq: 500, a: 0.02, dec: 0.18, peak: 0.3 }),
      default: (t) => tone(t, { from: 440, dec: 0.08, peak: 0.3 })
    };
    return {
      get enabled() { return enabled; },
      enable() { enabled = true; save('sl:sound', true); const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
      disable() { enabled = false; save('sl:sound', false); },
      toggle() { enabled ? this.disable() : this.enable(); return enabled; },
      play(material, kind = 'commit') {
        if (!enabled) return;
        const c = ensure();
        if (!c) return;
        if (c.state === 'suspended') c.resume();
        const t = c.currentTime + 0.005;
        if (kind === 'refuse') { tone(t, { from: 200, dec: 0.06, peak: 0.3 }); tone(t + 0.09, { from: 170, dec: 0.08, peak: 0.3 }); return; }
        const r = recipes[material] || recipes.default;
        const g = master.gain;
        if (kind === 'arm' || kind === 'cancel') master.gain = g * 0.55;
        try { r(t, kind); } finally { master.gain = g; }
      }
    };
  })();

  // ---------------------------------------------------------------- haptics (opt-in)
  const haptics = (() => {
    let enabled = !!load('sl:haptics', false);
    const patterns = { light: [6], medium: [12], heavy: [18, 30, 18], arm: [8], cancel: [4], refuse: [12, 40, 12] };
    return {
      get enabled() { return enabled; },
      get supported() { return typeof navigator.vibrate === 'function'; },
      enable() { enabled = true; save('sl:haptics', true); },
      disable() { enabled = false; save('sl:haptics', false); },
      toggle() { enabled ? this.disable() : this.enable(); return enabled; },
      pulse(kind = 'light') { if (enabled && typeof navigator.vibrate === 'function') try { navigator.vibrate(patterns[kind] || patterns.light); } catch (e) { /* blocked */ } }
    };
  })();

  // ---------------------------------------------------------------- registry
  const controls = new Map();
  const lit = new Map();
  const visible = new Set();
  const bound = new WeakSet();
  const targetSources = new Map();
  const pointer = { x: -9999, y: -9999, type: 'mouse', active: false };
  let io = null;
  let mo = null;
  let raf = 0;
  let rectsDirty = true;
  let started = false;
  let captionsOn = !!load('sl:captions', false);
  let tetherLayer = null;

  const material = (s) => s.el.getAttribute('data-sl-material') || (s.targets[0] && s.targets[0].getAttribute('data-sl-material')) || 'default';
  const weight = (s) => s.el.getAttribute('data-sl-weight') || 'light';
  const isHeavy = (s) => weight(s) === 'heavy';
  const holdMs = (s) => +s.el.getAttribute('data-sl-hold') || config.hold;
  // A wrapper (for example a <label> around a radio) delegates focus and name to the native control inside.
  const innerControl = (el) => (el.matches(NATIVE) ? null : el.querySelector('input:not([type=hidden]), select, textarea, button'));
  function ownName(el) {
    const al = el.getAttribute('aria-label');
    if (al) return al.trim();
    const lb = el.getAttribute('aria-labelledby');
    if (lb) {
      const t = lb.split(/\s+/).map((id) => doc.getElementById(id)).filter(Boolean).map((n) => n.textContent.trim()).join(' ');
      if (t) return t;
    }
    return (el.getAttribute('title') || '').trim();
  }
  function nameOf(el) {
    const own = ownName(el);
    if (own) return own;
    const inner = innerControl(el);
    if (inner) {
      const n = ownName(inner);
      if (n) return n;
      if (inner.labels && inner.labels[0]) return inner.labels[0].textContent.trim();
    }
    return '';
  }

  function makeState(el) {
    return {
      el, verb: el.getAttribute('data-sl-verb') || 'act', state: '', near: 0,
      hover: false, focus: false, touch: false, committing: false,
      holding: false, holdStart: 0, holdP: 0, downAt: 0,
      armed: false, armTimer: 0, pass: false, suppressUntil: 0,
      hesitant: false, hesTimer: 0, peekTimer: 0, longPressed: false, commitTimer: 0,
      targets: [], rect: null, caption: null, captionTimer: 0, tether: null, warned: {}
    };
  }

  function register(el) {
    if (el.closest(FX)) return;
    if (el.matches(CONTROL) && !controls.has(el)) {
      const s = makeState(el);
      controls.set(el, s);
      if (!bound.has(el)) {
        bound.add(el);
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('pointerdown', onDown);
        el.addEventListener('focusin', onFocusIn);
        el.addEventListener('focusout', onFocusOut);
        el.addEventListener('click', onClickCapture, true);
        el.addEventListener('click', onClickBubble);
        el.addEventListener('contextmenu', onContextMenu);
        el.addEventListener('keydown', onKeyDown);
      }
      applyMemory(s);
      setState(s, 'rest');
      if (config.dev) lint(s);
    }
    if (el.matches(MATERIAL) && !lit.has(el)) lit.set(el, { rect: null });
    if (io) io.observe(el);
    rectsDirty = true;
  }
  function unregisterControl(el) {
    const s = controls.get(el);
    if (!s) return;
    clearTimeout(s.armTimer); clearTimeout(s.hesTimer); clearTimeout(s.peekTimer); clearTimeout(s.commitTimer);
    clearTargets(s); hideCaption(s, true); removeTether(s);
    controls.delete(el);
  }
  function unregister(el) {
    unregisterControl(el);
    lit.delete(el);
    visible.delete(el);
    if (io) io.unobserve(el);
  }
  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches(CONTROL + ',' + MATERIAL)) register(node);
    node.querySelectorAll(CONTROL + ',' + MATERIAL).forEach(register);
  }

  function lint(s) {
    const el = s.el;
    const warn = (key, msg) => { if (s.warned[key]) return; s.warned[key] = 1; console.warn('[stringless] ' + msg, el); };
    if (!nameOf(el) && !el.textContent.trim()) warn('name', 'control has no accessible name. Add aria-label; it also feeds the caption layer.');
    if (innerControl(el)) return;
    if (!el.matches(NATIVE) && !el.hasAttribute('tabindex')) warn('focus', 'control is not focusable. Use a <button>, or add role and tabindex="0".');
    if (!el.matches(NATIVE) && !el.getAttribute('role')) warn('role', 'control has no role. Use a <button> or set role="button".');
  }

  // ---------------------------------------------------------------- state machine
  function amountOf(s) {
    switch (s.state) {
      case 'rehearse': case 'hold': case 'armed': case 'commit': return 1;
      case 'near': return round(s.near * 0.35, 3);
      default: return 0;
    }
  }
  function refresh(s) {
    let next = 'rest';
    if (s.committing) next = 'commit';
    else if (s.armed) next = 'armed';
    else if (s.holding) next = 'hold';
    else if (s.hover || s.focus || s.touch) next = 'rehearse';
    else if (s.near > 0.02) next = 'near';
    setState(s, next);
  }
  const ACTIVE = { rehearse: 1, hold: 1, armed: 1, commit: 1 };
  function setState(s, next) {
    const prev = s.state;
    if (prev === next) { if (next !== 'rest') pushTargets(s); return; }
    s.state = next;
    s.el.setAttribute('data-sl-state', next);
    if (next === 'rest') { clearTargets(s); removeTether(s); endHesitation(s); }
    else {
      if (!prev || prev === 'rest') resolveTargets(s);
      pushTargets(s);
    }
    if (ACTIVE[next] && !ACTIVE[prev]) {
      emit(s.el, 'sl:rehearse');
      startHesitation(s);
      if (s.el.getAttribute('data-sl-tether') === 'line') addTether(s);
    }
    if (ACTIVE[prev] && !ACTIVE[next]) {
      endHesitation(s);
      removeTether(s);
      if (prev !== 'commit') emit(s.el, 'sl:leave');
    }
    if (next === 'near' && (!prev || prev === 'rest')) emit(s.el, 'sl:near');
  }

  // ---------------------------------------------------------------- targets
  function findTargets(el, spec) {
    spec = spec.trim();
    if (!spec) return [];
    if (spec === 'self') return [el];
    if (spec === 'parent') return el.parentElement ? [el.parentElement] : [];
    const m = /^closest\((.+)\)$/.exec(spec);
    try {
      if (m) { const t = el.closest(m[1]); return t ? [t] : []; }
      return Array.from(doc.querySelectorAll(spec));
    } catch (e) { return []; }
  }
  function resolveTargets(s) {
    const spec = s.el.getAttribute('data-sl-target');
    s.targets = spec ? findTargets(s.el, spec) : [];
    if (config.dev && spec && !s.targets.length && !s.warned.target) { s.warned.target = 1; console.warn('[stringless] data-sl-target="' + spec + '" matched nothing', s.el); }
    const t = s.targets[0];
    if (t && t !== s.el) {
      const a = s.el.getBoundingClientRect();
      const b = t.getBoundingClientRect();
      const vx = b.left + b.width / 2 - (a.left + a.width / 2);
      const vy = b.top + b.height / 2 - (a.top + a.height / 2);
      const len = Math.hypot(vx, vy) || 1;
      setVar(s.el, '--sl-tdx', round(vx / len, 3));
      setVar(s.el, '--sl-tdy', round(vy / len, 3));
    }
  }
  function pushTargets(s) {
    const amount = amountOf(s);
    for (const t of s.targets) {
      let src = targetSources.get(t);
      if (!src) { src = new Map(); targetSources.set(t, src); }
      src.set(s, { verb: s.verb, amount, hold: s.holdP, armed: s.armed, intensity: intensityOf(s) });
      applyTarget(t);
    }
  }
  function clearTargets(s) {
    for (const t of s.targets) {
      const src = targetSources.get(t);
      if (src) { src.delete(s); applyTarget(t); }
    }
    s.targets = [];
  }
  const previewTimers = new WeakMap();
  function bestSource(t) {
    const src = targetSources.get(t);
    let best = null;
    if (src) for (const v of src.values()) if (!best || v.amount > best.amount || (v.amount === best.amount && v.hold > best.hold)) best = v;
    return best && (best.amount > 0 || best.hold > 0) ? best : null;
  }
  function applyTarget(t) {
    const src = targetSources.get(t);
    const best = bestSource(t);
    if (!best) {
      if (src && !src.size) targetSources.delete(t);
      t.removeAttribute('data-sl-armed');
      setVar(t, '--sl-rehearse', 0);
      setVar(t, '--sl-hold', 0);
      // Keep the preview attribute while --sl-rehearse transitions to 0, so the rehearsal plays backwards.
      if (t.hasAttribute('data-sl-preview') && !previewTimers.has(t)) {
        previewTimers.set(t, setTimeout(() => {
          previewTimers.delete(t);
          if (!bestSource(t)) t.removeAttribute('data-sl-preview');
        }, 300));
      }
      return;
    }
    const pending = previewTimers.get(t);
    if (pending) { clearTimeout(pending); previewTimers.delete(t); }
    if (t.getAttribute('data-sl-preview') !== best.verb) t.setAttribute('data-sl-preview', best.verb);
    t.toggleAttribute('data-sl-armed', !!best.armed);
    setVar(t, '--sl-rehearse', best.amount);
    setVar(t, '--sl-hold', round(best.hold, 3));
    setVar(t, '--sl-intensity', best.intensity);
  }

  // ---------------------------------------------------------------- hesitation + captions
  function startHesitation(s) {
    clearTimeout(s.hesTimer);
    const ms = +s.el.getAttribute('data-sl-hesitate') || config.hesitate;
    s.hesTimer = setTimeout(() => {
      if (!ACTIVE[s.state] || s.state === 'commit') return;
      s.hesitant = true;
      s.el.setAttribute('data-sl-hesitant', '');
      applyMemory(s);
      pushTargets(s);
      showCaption(s);
      bumpFluency(s.verb, 'hesitation');
      emit(s.el, 'sl:hesitate');
    }, ms);
  }
  function endHesitation(s) {
    clearTimeout(s.hesTimer);
    if (!s.hesitant) return;
    s.hesitant = false;
    s.el.removeAttribute('data-sl-hesitant');
    applyMemory(s);
    if (!captionsOn) hideCaption(s);
  }

  function showCaption(s) {
    const text = nameOf(s.el);
    if (!text || s.el.getAttribute('data-sl-caption') === 'none') return;
    if (!s.caption) {
      const c = doc.createElement('div');
      c.className = 'sl-caption';
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('data-sl-fx', '');
      doc.body.appendChild(c);
      s.caption = c;
    }
    s.caption.textContent = text;
    clearTimeout(s.captionTimer);
    placeCaption(s);
    requestAnimationFrame(() => s.caption && s.caption.setAttribute('data-show', ''));
  }
  function hideCaption(s, now) {
    const c = s.caption;
    if (!c) return;
    c.removeAttribute('data-show');
    clearTimeout(s.captionTimer);
    if (now) { c.remove(); s.caption = null; return; }
    s.captionTimer = setTimeout(() => { c.remove(); if (s.caption === c) s.caption = null; }, 220);
  }
  function placeCaption(s) {
    const c = s.caption;
    if (!c) return;
    const r = s.el.getBoundingClientRect();
    const side = s.el.getAttribute('data-sl-caption') || 'bottom';
    const cw = c.offsetWidth;
    const ch = c.offsetHeight;
    let x = r.left + r.width / 2;
    let y = r.bottom + 8;
    if (side === 'top' || (side === 'bottom' && y + ch > innerHeight - 4)) y = r.top - ch - 8;
    if (side === 'left') { x = r.left - cw / 2 - 8; y = r.top + r.height / 2 - ch / 2; }
    if (side === 'right') { x = r.right + cw / 2 + 8; y = r.top + r.height / 2 - ch / 2; }
    x = clamp(x, cw / 2 + 4, innerWidth - cw / 2 - 4);
    c.style.left = round(x, 1) + 'px';
    c.style.top = round(Math.max(4, y), 1) + 'px';
  }
  function peek(s, ms) {
    showCaption(s);
    clearTimeout(s.peekTimer);
    s.peekTimer = setTimeout(() => { if (!captionsOn && !s.hesitant) hideCaption(s); }, ms || config.peek);
  }
  const captions = {
    get on() { return captionsOn; },
    show() { captionsOn = true; save('sl:captions', true); html.setAttribute('data-sl-captions', 'on'); for (const s of controls.values()) if (visible.has(s.el)) showCaption(s); },
    hide() { captionsOn = false; save('sl:captions', false); html.removeAttribute('data-sl-captions'); for (const s of controls.values()) if (!s.hesitant) hideCaption(s); },
    toggle() { captionsOn ? this.hide() : this.show(); announce(captionsOn ? 'Captions on' : 'Captions off'); return captionsOn; },
    peek(el, ms) { const s = controls.get(el); if (s) peek(s, ms); }
  };

  // ---------------------------------------------------------------- tethers
  const SVGNS = 'http://www.w3.org/2000/svg';
  function addTether(s) {
    if (!s.targets.length) return;
    if (!tetherLayer) {
      tetherLayer = doc.createElementNS(SVGNS, 'svg');
      tetherLayer.setAttribute('class', 'sl-tethers');
      tetherLayer.setAttribute('aria-hidden', 'true');
      tetherLayer.setAttribute('data-sl-fx', '');
      doc.body.appendChild(tetherLayer);
    }
    removeTether(s);
    s.tether = s.targets.filter((t) => t !== s.el).map(() => {
      const p = doc.createElementNS(SVGNS, 'path');
      tetherLayer.appendChild(p);
      return p;
    });
    drawTether(s);
  }
  function drawTether(s) {
    if (!s.tether) return;
    const a = s.el.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    s.targets.filter((t) => t !== s.el).forEach((t, i) => {
      const p = s.tether[i];
      if (!p) return;
      const b = t.getBoundingClientRect();
      const bx = clamp(ax, b.left + 6, b.right - 6);
      const by = clamp(ay, b.top + 6, b.bottom - 6);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2 - Math.min(60, Math.hypot(bx - ax, by - ay) * 0.25);
      p.setAttribute('d', `M${round(ax, 1)} ${round(ay, 1)} Q${round(mx, 1)} ${round(my, 1)} ${round(bx, 1)} ${round(by, 1)}`);
    });
  }
  function removeTether(s) {
    if (!s.tether) return;
    s.tether.forEach((p) => p.remove());
    s.tether = null;
  }

  // ---------------------------------------------------------------- input handlers
  function onEnter(e) {
    if (e.pointerType === 'touch') return;
    const s = controls.get(e.currentTarget);
    if (!s) return;
    s.hover = true;
    refresh(s);
    if (captionsOn) showCaption(s);
  }
  function onLeave(e) {
    if (e.pointerType === 'touch') return;
    const s = controls.get(e.currentTarget);
    if (!s) return;
    s.hover = false;
    if (s.holding) cancelHold(s);
    refresh(s);
  }
  function onDown(e) {
    if (e.button !== 0) return;
    const s = controls.get(e.currentTarget);
    if (!s) return;
    s.downAt = now();
    s.longPressed = false;
    if (e.pointerType === 'touch') { s.touch = true; pointer.type = 'touch'; light.set(e.clientX, e.clientY); }
    const up = () => { cleanup(); onUp(s); };
    const cancel = () => { cleanup(); onPointerCancel(s); };
    const cleanup = () => { removeEventListener('pointerup', up, true); removeEventListener('pointercancel', cancel, true); };
    addEventListener('pointerup', up, true);
    addEventListener('pointercancel', cancel, true);
    if (isHeavy(s) && !s.armed) startHold(s);
    else if (e.pointerType === 'touch') {
      clearTimeout(s.peekTimer);
      s.peekTimer = setTimeout(() => { s.longPressed = true; peek(s); }, 520);
    }
    refresh(s);
  }
  function onUp(s) {
    if (!s.longPressed) clearTimeout(s.peekTimer);
    // A hold that already committed: swallow the click the release is about to produce.
    if (s.heldCommit) { s.heldCommit = false; s.suppressUntil = now() + 450; }
    const held = now() - (s.downAt || now());
    if (s.holding) {
      if (held < 260) stopHold(s);
      else { cancelHold(s); s.suppressUntil = now() + 450; }
    }
    if (s.longPressed) s.suppressUntil = now() + 450;
    if (s.touch) { s.touch = false; setTimeout(() => refresh(s), 60); }
    refresh(s);
  }
  function onPointerCancel(s) {
    clearTimeout(s.peekTimer);
    s.heldCommit = false;
    if (s.holding) cancelHold(s);
    s.touch = false;
    refresh(s);
  }
  function onContextMenu(e) { const s = controls.get(e.currentTarget); if (s && (s.holding || s.touch)) e.preventDefault(); }
  function onFocusIn(e) {
    const s = controls.get(e.currentTarget);
    if (!s) return;
    let fv = true;
    try { fv = s.el.matches(':focus-visible') || s.el.querySelector(':focus-visible') != null; } catch (err) { /* old engine */ }
    if (fv) { s.focus = true; refresh(s); if (captionsOn) showCaption(s); }
  }
  function onFocusOut(e) {
    const s = controls.get(e.currentTarget);
    if (!s || s.el.contains(e.relatedTarget)) return;
    s.focus = false;
    if (s.armed) disarm(s, 'blur');
    refresh(s);
  }
  function onKeyDown(e) {
    const s = controls.get(e.currentTarget);
    if (!s || e.target !== s.el) return;
    if (s.el.matches(NATIVE)) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.el.click(); }
  }
  function onClickCapture(e) {
    const s = controls.get(e.currentTarget);
    if (!s) return;
    if (s.pass) { s.pass = false; return; }
    if (s.suppressUntil && now() < s.suppressUntil) { s.suppressUntil = 0; e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (!isHeavy(s)) return;
    if (s.armed) { clearTimeout(s.armTimer); s.armed = false; return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    // Keyboard and assistive-tech clicks arrive with detail 0 and no recent pointerdown.
    arm(s, e.detail > 0 && now() - s.downAt < 1200 ? 'pointer' : 'key');
  }
  function onClickBubble(e) {
    const s = controls.get(e.currentTarget);
    if (!s) return;
    // A click on a <label> wrapper is re-dispatched to its control; commit once, on that second click.
    const inner = innerControl(s.el);
    if (inner && !inner.contains(e.target) && s.el.tagName === 'LABEL') return;
    commit(s);
  }

  // ---------------------------------------------------------------- hold / arm / commit
  function startHold(s) {
    s.holding = true;
    s.holdStart = now();
    s.holdP = 0;
    refresh(s);
    schedule();
  }
  function stopHold(s) {
    s.holding = false;
    s.holdP = 0;
    setVar(s.el, '--sl-hold', 0);
    pushTargets(s);
    refresh(s);
  }
  function cancelHold(s) {
    if (!s.holding) return;
    const from = s.holdP;
    s.holding = false;
    emit(s.el, 'sl:cancel', { reason: 'release' });
    if (from > 0.15) { sound.play(material(s), 'cancel'); haptics.pulse('cancel'); }
    const start = now();
    const dur = 80 + 320 * from;
    const tick = () => {
      if (s.holding) return;
      const p = clamp((now() - start) / dur);
      s.holdP = from * (1 - p) * (1 - p);
      setVar(s.el, '--sl-hold', round(s.holdP, 3));
      pushTargets(s);
      if (p < 1) requestAnimationFrame(tick);
      else { s.holdP = 0; setVar(s.el, '--sl-hold', 0); refresh(s); }
    };
    requestAnimationFrame(tick);
    refresh(s);
  }
  function commitByHold(s) {
    s.holding = false;
    s.heldCommit = true;
    s.holdP = 1;
    setVar(s.el, '--sl-hold', 1);
    s.pass = true;
    s.suppressUntil = now() + 600;
    s.el.click();
  }
  function arm(s, source) {
    s.armed = true;
    s.armSource = source || 'key';
    refresh(s);
    haptics.pulse('arm');
    sound.play(material(s), 'arm');
    announce((nameOf(s.el) ? nameOf(s.el) + '. ' : '') + config.armHint);
    emit(s.el, 'sl:arm');
    peek(s, config.armWindow);
    clearTimeout(s.armTimer);
    s.armTimer = setTimeout(() => disarm(s, 'timeout'), config.armWindow);
  }
  function disarm(s, reason) {
    if (!s.armed) return;
    s.armed = false;
    clearTimeout(s.armTimer);
    emit(s.el, 'sl:cancel', { reason });
    sound.play(material(s), 'cancel');
    if (!captionsOn && !s.hesitant) hideCaption(s);
    refresh(s);
  }
  function commit(s) {
    bumpFluency(s.verb, 'use');
    bumpPatina(s);
    haptics.pulse(weight(s));
    sound.play(material(s), 'commit');
    endHesitation(s);
    if (!captionsOn) hideCaption(s);
    s.committing = true;
    refresh(s);
    emit(s.el, 'sl:commit');
    clearTimeout(s.commitTimer);
    s.commitTimer = setTimeout(() => {
      s.committing = false;
      s.holdP = 0;
      setVar(s.el, '--sl-hold', 0);
      refresh(s);
    }, 480);
  }

  // ---------------------------------------------------------------- frame loop
  const light = {
    set(x, y) { pointer.x = x; pointer.y = y; pointer.active = true; schedule(); }
  };
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  let lastPX = null;
  let lastPY = null;
  function frame() {
    raf = 0;
    let again = false;
    if (rectsDirty) {
      rectsDirty = false;
      for (const el of visible) {
        const r = el.getBoundingClientRect();
        const s = controls.get(el);
        if (s) s.rect = r;
        const l = lit.get(el);
        if (l) l.rect = r;
      }
    }
    const px = pointer.x;
    const py = pointer.y;
    if (px !== lastPX || py !== lastPY) {
      lastPX = px; lastPY = py;
      // Lit surfaces may move (slides, folds); re-measure the visible ones before writing their light.
      for (const [el, l] of lit) if (visible.has(el)) l.rect = el.getBoundingClientRect();
      html.style.setProperty('--sl-px', round(px, 1) + 'px');
      html.style.setProperty('--sl-py', round(py, 1) + 'px');
      for (const [el, l] of lit) {
        if (!visible.has(el) || !l.rect) continue;
        const r = l.rect;
        setVar(el, '--sl-lx', round(clamp(((px - r.left) / (r.width || 1)) * 100, -60, 160), 1));
        setVar(el, '--sl-ly', round(clamp(((py - r.top) / (r.height || 1)) * 100, -60, 160), 1));
      }
    }
    for (const [el, s] of controls) {
      let near = 0;
      if (visible.has(el) && s.rect && pointer.active && pointer.type !== 'touch') {
        const r = s.rect;
        const radius = +el.getAttribute('data-sl-radius') || config.radius;
        const dx = Math.max(r.left - px, 0, px - r.right);
        const dy = Math.max(r.top - py, 0, py - r.bottom);
        near = clamp(1 - Math.hypot(dx, dy) / radius);
        if (near > 0) {
          setVar(el, '--sl-dx', round(clamp((px - (r.left + r.width / 2)) / (r.width / 2 || 1), -1, 1), 3));
          setVar(el, '--sl-dy', round(clamp((py - (r.top + r.height / 2)) / (r.height / 2 || 1), -1, 1), 3));
        }
      }
      if (s.focus || s.touch || s.hover) near = 1;
      if (Math.abs(near - s.near) > 0.004 || (near === 0 && s.near !== 0)) {
        s.near = near;
        setVar(el, '--sl-near', round(near, 3));
        refresh(s);
      }
      if (s.armed && s.armSource === 'pointer' && !s.hover && doc.activeElement !== el && s.near < 0.5) disarm(s, 'leave');
      if (s.holding) {
        s.holdP = clamp((now() - s.holdStart) / holdMs(s));
        setVar(el, '--sl-hold', round(s.holdP, 3));
        pushTargets(s);
        if (s.holdP >= 1) commitByHold(s);
        else again = true;
      }
      if (s.tether) drawTether(s);
      if (s.caption) placeCaption(s);
    }
    if (again) schedule();
  }

  // ---------------------------------------------------------------- verbs
  function fxLayer(el) {
    const host = el.parentElement || doc.body;
    const box = doc.createElement('div');
    box.setAttribute('data-sl-fx', '');
    box.setAttribute('aria-hidden', 'true');
    Object.assign(box.style, { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '2147483000', overflow: 'visible', margin: '0', padding: '0', border: '0', background: 'none' });
    host.appendChild(box);
    const br = box.getBoundingClientRect();
    return { box, ox: br.left, oy: br.top };
  }
  function cloneAt(el, r, layer) {
    const c = el.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    c.removeAttribute('data-sl-verb');
    c.querySelectorAll('[data-sl-verb]').forEach((n) => n.removeAttribute('data-sl-verb'));
    c.setAttribute('aria-hidden', 'true');
    c.inert = true;
    Object.assign(c.style, { position: 'absolute', left: r.left - layer.ox + 'px', top: r.top - layer.oy + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', boxSizing: 'border-box', visibility: 'visible', pointerEvents: 'none', transition: 'none' });
    layer.box.appendChild(c);
    return c;
  }
  const settled = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => null)));
  function handle(el, layer, anims, { hideOriginal = true } = {}) {
    let state = 'done';
    return {
      element: el,
      get state() { return state; },
      async restore() {
        if (state !== 'done') return;
        state = 'restoring';
        anims.forEach((a) => { a.playbackRate = Math.abs(a.playbackRate) * 1.35; a.reverse(); });
        await settled(anims);
        if (hideOriginal) el.style.visibility = '';
        anims.forEach((a) => a.cancel());
        if (layer) layer.box.remove();
        state = 'restored';
      },
      finish() { if (layer) layer.box.remove(); state = 'finished'; }
    };
  }
  function toPoint(target) {
    if (!target) return null;
    if (target.getBoundingClientRect) { const r = target.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; }
    return { x: target.x, y: target.y };
  }

  /** Break an element into falling shards. Resolves to a handle with restore() for undo. */
  async function shatter(el, opts = {}) {
    const r = el.getBoundingClientRect();
    const layer = fxLayer(el);
    const anims = [];
    const tint = opts.tint || null;
    if (reduced()) {
      const c = cloneAt(el, r, layer);
      el.style.visibility = 'hidden';
      anims.push(c.animate([{ opacity: 1, filter: 'grayscale(0)' }, { opacity: 0, filter: 'grayscale(1) brightness(.6)' }], { duration: 240, fill: 'forwards' }));
      await settled(anims);
      return handle(el, layer, anims);
    }
    const cols = opts.cols || clamp(Math.round(r.width / 56), 3, 9);
    const rows = opts.rows || clamp(Math.round(r.height / 48), 2, 7);
    const pts = [];
    for (let j = 0; j <= rows; j++) {
      pts[j] = [];
      for (let i = 0; i <= cols; i++) {
        const ex = i === 0 || i === cols;
        const ey = j === 0 || j === rows;
        pts[j][i] = [
          (i * r.width) / cols + (ex ? 0 : (Math.random() - 0.5) * (r.width / cols) * 0.75),
          (j * r.height) / rows + (ey ? 0 : (Math.random() - 0.5) * (r.height / rows) * 0.75)
        ];
      }
    }
    const shards = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
        if (Math.random() < 0.5) shards.push([a, b, c], [a, c, d]);
        else shards.push([a, b, d], [b, c, d]);
      }
    }
    const o = opts.origin ? { x: opts.origin.x - r.left, y: opts.origin.y - r.top } : { x: r.width / 2, y: r.height / 2 };
    const duration = opts.duration || 950;
    const gravity = opts.gravity == null ? 1 : opts.gravity;
    for (const t of shards) {
      const c = cloneAt(el, r, layer);
      c.style.clipPath = 'polygon(' + t.map((p) => round(p[0], 1) + 'px ' + round(p[1], 1) + 'px').join(',') + ')';
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
      const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      c.style.transformOrigin = round(cx, 1) + 'px ' + round(cy, 1) + 'px';
      const vx = (cx - o.x) / (r.width || 1);
      const vy = (cy - o.y) / (r.height || 1);
      const spread = 50 + Math.random() * 70;
      const tx = vx * spread * 2 + (Math.random() - 0.5) * 24;
      const ty = vy * spread + (140 + Math.random() * 160) * gravity;
      const rot = (Math.random() - 0.5) * 120;
      const end = tint ? `grayscale(1) brightness(.45) sepia(${tint === 'ash' ? 0.3 : 0})` : 'none';
      anims.push(c.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1, filter: 'none' },
        { transform: `translate(${round(tx * 0.3, 1)}px, ${round(ty * 0.05 - 12, 1)}px) rotate(${round(rot * 0.25, 1)}deg)`, opacity: 1, offset: 0.22 },
        { transform: `translate(${round(tx, 1)}px, ${round(ty, 1)}px) rotate(${round(rot, 1)}deg)`, opacity: 0, filter: end }
      ], { duration: duration * (0.75 + Math.random() * 0.5), easing: 'cubic-bezier(.3,.05,.7,1)', fill: 'forwards' }));
    }
    el.style.visibility = 'hidden';
    await settled(anims);
    return handle(el, layer, anims);
  }

  /** Evaporate an element in place. Resolves to a handle with restore(). */
  async function dissolve(el, opts = {}) {
    const k = reduced()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, filter: 'blur(0px)', transform: 'none' }, { opacity: 0, filter: `blur(${opts.blur || 8}px)`, transform: `translateY(${opts.rise == null ? -14 : -opts.rise}px) scale(1.03)` }];
    const a = el.animate(k, { duration: reduced() ? 200 : opts.duration || 700, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    await settled([a]);
    return handle(el, null, [a], { hideOriginal: false });
  }

  /** Fold an element shut and send it toward `to` (element or {x,y}). Resolves to a handle with restore(). */
  async function fold(el, opts = {}) {
    const r = el.getBoundingClientRect();
    const p = toPoint(opts.to);
    const dx = p ? p.x - (r.left + r.width / 2) : 0;
    const dy = p ? p.y - (r.top + r.height / 2) : 0;
    const prevOrigin = el.style.transformOrigin;
    el.style.transformOrigin = '50% 0%';
    const k = reduced()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { transform: 'perspective(900px) rotateX(0deg) scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'perspective(900px) rotateX(62deg) scale(.94, .55)', opacity: 1, filter: 'brightness(.82)', offset: 0.45 },
          { transform: `translate(${round(dx, 1)}px, ${round(dy, 1)}px) perspective(900px) rotateX(84deg) scale(.18, .1)`, opacity: 0, filter: 'brightness(.7)' }
        ];
    const a = el.animate(k, { duration: reduced() ? 200 : opts.duration || 820, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
    await settled([a]);
    const h = handle(el, null, [a], { hideOriginal: false });
    const restore = h.restore;
    h.restore = async () => { await restore(); el.style.transformOrigin = prevOrigin; };
    return h;
  }

  /** Fly a copy of `el` along an arc to `to` (element or {x,y}). Resolves when it lands. */
  async function travel(el, to, opts = {}) {
    const r = el.getBoundingClientRect();
    const p = toPoint(to);
    if (!p) return;
    const layer = fxLayer(el);
    const c = cloneAt(el, r, layer);
    const x0 = r.left + r.width / 2;
    const y0 = r.top + r.height / 2;
    const dx = p.x - x0;
    const dy = p.y - y0;
    const lift = (opts.arc == null ? 0.3 : opts.arc) * Math.hypot(dx, dy);
    const endScale = opts.scale == null ? 0.25 : opts.scale;
    let k;
    if (reduced()) {
      k = [{ opacity: 1 }, { opacity: 0 }];
    } else {
      k = [];
      const n = 18;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = dx * t;
        const y = dy * t - 4 * lift * t * (1 - t);
        const sc = 1 + (endScale - 1) * t;
        k.push({ transform: `translate(${round(x, 1)}px, ${round(y, 1)}px) scale(${round(sc, 3)}) rotate(${round((opts.spin || 0) * t, 1)}deg)`, opacity: t > 0.85 ? (1 - t) / 0.15 : 1 });
      }
    }
    const a = c.animate(k, { duration: reduced() ? 200 : opts.duration || 720, easing: opts.easing || 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' });
    await settled([a]);
    layer.box.remove();
  }

  /** Stream droplets from one element into another. Resolves when the last drop lands. */
  async function pour(from, to, opts = {}) {
    if (reduced()) return new Promise((r) => setTimeout(r, 160));
    const a = from.getBoundingClientRect();
    const b = toPoint(to);
    if (!b) return;
    const layer = fxLayer(from);
    const count = opts.count || 14;
    const color = opts.color || getComputedStyle(from).getPropertyValue('--sl-liquid').trim() || 'currentColor';
    const x0 = a.left + a.width / 2;
    const y0 = a.bottom - 4;
    const anims = [];
    for (let i = 0; i < count; i++) {
      const d = doc.createElement('i');
      const size = 5 + Math.random() * 5;
      Object.assign(d.style, { position: 'absolute', left: x0 - layer.ox - size / 2 + 'px', top: y0 - layer.oy - size / 2 + 'px', width: size + 'px', height: size * 1.2 + 'px', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: color, opacity: '0' });
      layer.box.appendChild(d);
      const dx = b.x - x0 + (Math.random() - 0.5) * 10;
      const dy = b.y - y0;
      const k = [];
      for (let s = 0; s <= 10; s++) {
        const t = s / 10;
        k.push({ transform: `translate(${round(dx * t, 1)}px, ${round(dy * t * t - 18 * t * (1 - t), 1)}px)`, opacity: s === 0 ? 0 : s === 10 ? 0 : 0.9 });
      }
      anims.push(d.animate(k, { duration: opts.duration || 620, delay: i * (opts.interval || 45), easing: 'linear', fill: 'both' }));
    }
    await settled(anims);
    layer.box.remove();
  }

  /** Rings that spread from an element: share, publish, broadcast. */
  async function ripple(el, opts = {}) {
    const r = el.getBoundingClientRect();
    const layer = fxLayer(el);
    const rings = reduced() ? 1 : opts.rings || 3;
    const color = opts.color || getComputedStyle(el).color;
    const size = Math.max(r.width, r.height);
    const anims = [];
    for (let i = 0; i < rings; i++) {
      const d = doc.createElement('i');
      Object.assign(d.style, { position: 'absolute', left: r.left + r.width / 2 - size / 2 - layer.ox + 'px', top: r.top + r.height / 2 - size / 2 - layer.oy + 'px', width: size + 'px', height: size + 'px', borderRadius: '50%', border: '1.5px solid ' + color, opacity: '0' });
      layer.box.appendChild(d);
      const k = reduced() ? [{ opacity: 0.8 }, { opacity: 0 }] : [{ transform: 'scale(1)', opacity: 0.7 }, { transform: `scale(${opts.scale || 4})`, opacity: 0 }];
      anims.push(d.animate(k, { duration: opts.duration || 1100, delay: i * 180, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'both' }));
    }
    await settled(anims);
    layer.box.remove();
  }

  /** Shake "no". The universal refusal: invalid input, limit reached, not allowed. */
  function refuse(el, opts = {}) {
    sound.play(el.getAttribute('data-sl-material') || 'default', 'refuse');
    haptics.pulse('refuse');
    if (reduced()) {
      const color = opts.color || '#c8473a';
      return el.animate([{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: `0 0 0 3px ${color}` }, { boxShadow: '0 0 0 0 transparent' }], { duration: 640 }).finished.catch(() => null);
    }
    const a = opts.amplitude || 7;
    return el.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: `${-a}px 0`, rotate: '-1deg' },
      { translate: `${a * 0.8}px 0`, rotate: '1deg' },
      { translate: `${-a * 0.5}px 0`, rotate: '-.5deg' },
      { translate: `${a * 0.25}px 0`, rotate: '0deg' },
      { translate: '0 0', rotate: '0deg' }
    ], { duration: 440, easing: 'ease-out' }).finished.catch(() => null);
  }

  /** Press into place, like setting something down for good: save, confirm, accept. */
  function settle(el, opts = {}) {
    if (reduced()) return el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.92)' }, { filter: 'brightness(1)' }], { duration: 300 }).finished.catch(() => null);
    const e = springEasing(opts.material || el.getAttribute('data-sl-material') || 'default');
    return el.animate([{ translate: '0 0', scale: '1' }, { translate: `0 ${opts.depth || 2}px`, scale: '.985', offset: 0.3 }, { translate: '0 0', scale: '1' }], { duration: Math.max(380, e.duration), easing: e.easing }).finished.catch(() => null);
  }

  /** A single hard glint across the element: complete, verified, solid. */
  async function crystallize(el, opts = {}) {
    const r = el.getBoundingClientRect();
    const layer = fxLayer(el);
    const d = doc.createElement('i');
    const cs = getComputedStyle(el);
    Object.assign(d.style, {
      position: 'absolute', left: r.left - layer.ox + 'px', top: r.top - layer.oy + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: cs.borderRadius,
      background: `linear-gradient(115deg, transparent 38%, ${opts.color || 'rgb(255 255 255 / .8)'} 50%, transparent 62%)`, backgroundSize: '260% 100%', mixBlendMode: 'soft-light'
    });
    layer.box.appendChild(d);
    const k = reduced() ? [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }] : [{ backgroundPosition: '120% 0' }, { backgroundPosition: '-40% 0' }];
    const a = d.animate(k, { duration: opts.duration || 700, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
    await settled([a]);
    layer.box.remove();
  }

  /**
   * The echo of a heavy action: a remnant you can act on to undo it.
   * remnant({ anchor, parent, material, duration, label, onRestore, onExpire, className })
   */
  function remnant(opts = {}) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'sl-remnant' + (opts.className ? ' ' + opts.className : '');
    b.setAttribute('data-sl-material', opts.material || 'ash');
    b.setAttribute('data-sl-verb', opts.verb || 'restore');
    b.setAttribute('aria-label', opts.label || 'Undo');
    if (opts.html) b.innerHTML = opts.html;
    if (opts.anchor && opts.anchor.parentNode) opts.anchor.parentNode.insertBefore(b, opts.anchor);
    else (opts.parent || doc.body).appendChild(b);
    const duration = opts.duration || 7000;
    let life = null;
    try { life = b.animate([{ '--sl-life': 1 }, { '--sl-life': 0 }], { duration, fill: 'forwards' }); } catch (e) { life = null; }
    let done = false;
    let timer = 0;
    let remaining = duration;
    let startedAt = now();
    const pause = () => { if (life) life.pause(); clearTimeout(timer); remaining -= now() - startedAt; };
    const resume = () => { if (done) return; if (life) life.play(); startedAt = now(); clearTimeout(timer); timer = setTimeout(() => finish(false), Math.max(0, remaining)); };
    const finish = (restored) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (life) life.pause();
      const out = b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: restored ? 120 : 360, fill: 'forwards' });
      out.finished.catch(() => null).then(() => b.remove());
      if (restored) { opts.onRestore && opts.onRestore(); announce(opts.restoredText || 'Restored'); }
      else opts.onExpire && opts.onExpire();
    };
    b.addEventListener('pointerenter', pause);
    b.addEventListener('pointerleave', resume);
    b.addEventListener('focus', pause);
    b.addEventListener('blur', resume);
    b.addEventListener('click', () => finish(true));
    timer = setTimeout(() => finish(false), duration);
    if (opts.announce !== false) announce(opts.announceText || (opts.label || 'Undo') + ' is available for ' + Math.round(duration / 1000) + ' seconds.');
    return { element: b, restore: () => finish(true), expire: () => finish(false) };
  }

  function phase(el, value) {
    const prev = el.getAttribute('data-sl-phase');
    if (value) el.setAttribute('data-sl-phase', value);
    else el.removeAttribute('data-sl-phase');
    if (prev !== value) emit(el, 'sl:phase', { from: prev, to: value });
  }

  // ---------------------------------------------------------------- filters
  function injectFilters() {
    if (doc.getElementById('sl-filters')) return;
    const wrap = doc.createElement('div');
    wrap.setAttribute('data-sl-fx', '');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<svg id="sl-filters" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" focusable="false">'
      + '<filter id="sl-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>'
      + '<filter id="sl-heat" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="3"><animate attributeName="seed" values="1;9;1" dur="2.4s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="6"/></filter>'
      + '<filter id="sl-rough"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>'
      + '<filter id="sl-crack"><feTurbulence type="turbulence" baseFrequency="0.02 0.08" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>'
      + '<filter id="sl-frost" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .92  0 0 0 0 .96  0 0 0 0 1  0 0 0 .55 0" result="f"/><feComposite in="f" in2="SourceGraphic" operator="in" result="fi"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="fi"/></feMerge></filter>'
      + '</svg>';
    doc.body.appendChild(wrap);
  }

  // ---------------------------------------------------------------- global listeners
  function isTyping(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function onGlobalKey(e) {
    if (e.key === 'Escape') {
      for (const s of controls.values()) { if (s.armed) disarm(s, 'escape'); if (s.holding) cancelHold(s); }
      return;
    }
    if (config.captionKey && e.key === config.captionKey && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) captions.toggle();
  }
  function onPointerMove(e) {
    pointer.type = e.pointerType || 'mouse';
    if (pointer.type === 'touch') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    schedule();
  }
  function onPointerOut(e) { if (!e.relatedTarget) { pointer.active = false; pointer.x = -9999; pointer.y = -9999; schedule(); } }
  function dirty() { rectsDirty = true; schedule(); }

  // ---------------------------------------------------------------- init
  function init(opts = {}) {
    Object.assign(config, opts);
    if (started) { scan(doc.body); return api; }
    started = true;
    registerProps();
    injectFilters();
    html.setAttribute('data-sl-ready', '');
    if (captionsOn) html.setAttribute('data-sl-captions', 'on');
    io = 'IntersectionObserver' in G
      ? new IntersectionObserver((entries) => {
          for (const en of entries) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); }
          dirty();
          if (captionsOn) for (const en of entries) { const s = controls.get(en.target); if (s) (en.isIntersecting ? showCaption(s) : hideCaption(s, true)); }
        }, { rootMargin: '160px' })
      : null;
    scan(doc.body);
    if (!io) for (const el of [...controls.keys(), ...lit.keys()]) visible.add(el);
    mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n));
          m.removedNodes.forEach((n) => {
            if (n.nodeType !== 1 || n.isConnected) return;
            if (controls.has(n) || lit.has(n)) unregister(n);
            if (n.querySelectorAll) n.querySelectorAll(CONTROL + ',' + MATERIAL).forEach((c) => { if (!c.isConnected) unregister(c); });
          });
        } else if (m.type === 'attributes') {
          const el = m.target;
          if (m.attributeName === 'data-sl-verb') {
            if (el.hasAttribute('data-sl-verb')) { const s = controls.get(el); if (s) { s.verb = el.getAttribute('data-sl-verb'); applyMemory(s); } else register(el); }
            else { unregisterControl(el); if (!lit.has(el)) unregister(el); }
          } else if (m.attributeName === 'data-sl-material') {
            if (el.hasAttribute('data-sl-material')) register(el);
            else { lit.delete(el); if (!controls.has(el)) unregister(el); }
          }
        }
      }
      dirty();
    });
    mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sl-verb', 'data-sl-material'] });
    addEventListener('pointermove', onPointerMove, { passive: true });
    doc.addEventListener('pointerout', onPointerOut, { passive: true });
    addEventListener('scroll', dirty, { passive: true, capture: true });
    addEventListener('resize', dirty, { passive: true });
    addEventListener('keydown', onGlobalKey);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(dirty);
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', dirty);
    return api;
  }

  const api = {
    version: VERSION,
    config,
    init,
    refresh() { scan(doc.body); dirty(); },
    announce,
    captions,
    sound,
    haptics,
    light,
    physics,
    springEasing,
    spring,
    phase,
    remnant,
    verbs: { shatter, dissolve, fold, travel, pour, ripple, refuse, settle, crystallize },
    fluency: {
      get: fluencyOf,
      reset() { fluencyData = {}; save('sl:fluency', fluencyData); for (const s of controls.values()) applyMemory(s); }
    },
    patina: {
      get: wearOf,
      reset() { patinaData = {}; save('sl:patina', patinaData); for (const s of controls.values()) applyMemory(s); }
    },
    get reducedMotion() { return reduced(); },
    stateOf(el) { const s = controls.get(el); return s ? s.state : null; }
  };
  G.Stringless = api;

  if (!html.hasAttribute('data-sl-manual')) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => init(), { once: true });
    else init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
