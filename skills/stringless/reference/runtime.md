# Runtime

`assets/runtime/stringless.js` and `stringless.css`: 16 KB and 5 KB gzipped, no dependencies, no build step. They give every stringless control the plumbing (proximity, rehearsal, weighted holds, captions, memory, verbs, echoes, sound) so the design work goes into the metaphor.

## Install

```bash
node <skill-dir>/scripts/install-runtime.mjs            # copies into public/stringless/ or ./stringless/
node <skill-dir>/scripts/install-runtime.mjs --dest src/vendor/stringless
```

```html
<link rel="stylesheet" href="/stringless/stringless.css">
<script src="/stringless/stringless.js" defer></script>
```

With a bundler: `import './vendor/stringless/stringless.js'` and import the CSS the project's usual way. The script sets `window.Stringless` and starts on DOMContentLoaded. To configure first, put `data-sl-manual` on `<html>` and call `Stringless.init({...})` yourself.

## Control attributes

| Attribute | Value | Effect |
|---|---|---|
| `data-sl-verb` | a verb (`delete`, `save`, `send`) | makes the element a stringless control; its verb names the preview on the target |
| `data-sl-target` | CSS selector, `self`, `parent`, or `closest(<selector>)` | what reacts on approach and rehearse |
| `data-sl-weight` | `light` (default), `medium`, `heavy` | heavy needs a hold, or two presses for keyboard and screen readers |
| `data-sl-hold` | milliseconds (default 1100) | hold length for heavy controls |
| `data-sl-radius` | pixels (default 120) | proximity radius |
| `data-sl-material` | a material name | material surface and light response; also picks the sound |
| `data-sl-tether` | `line` | draws a line to the target while rehearsing |
| `data-sl-lean` | (present) | translates the control a few pixels toward its target on approach |
| `data-sl-id` | stable id | counts uses for patina (`--sl-wear`) |
| `data-sl-caption` | `top`, `bottom` (default), `left`, `right`, `none` | where captions appear |
| `data-sl-hesitate` | milliseconds (default 1600) | rehearsal time before the hesitation caption |

The control must be focusable and named: use a `<button>` with `aria-label`, or set `role` and `tabindex="0"`. The runtime warns in the console on localhost when either is missing.

## What the runtime sets

On the control:

| Name | Meaning |
|---|---|
| `data-sl-state` | `rest`, `near`, `rehearse`, `hold`, `armed`, `commit` |
| `data-sl-hesitant` | present while the user hesitates |
| `--sl-near` | 0 to 1, pointer proximity (1 on hover, focus or touch) |
| `--sl-dx`, `--sl-dy` | -1 to 1, which side of the control the pointer is on |
| `--sl-tdx`, `--sl-tdy` | -1 to 1, unit direction from the control to its target |
| `--sl-hold` | 0 to 1, hold progress |
| `--sl-intensity` | 1 for new users down to 0.4 for fluent ones; back to 1 when hesitant |
| `--sl-fluency` | 0 to 1 for this verb |
| `--sl-wear` | 0 to 1, from use count (needs `data-sl-id`) |

On each target:

| Name | Meaning |
|---|---|
| `data-sl-preview` | the verb being rehearsed on it |
| `data-sl-armed` | present while a heavy control waits for its second press |
| `--sl-rehearse` | 0 at rest, about 0.35 on approach, 1 on hover, focus or hold |
| `--sl-hold` | the hold progress of the control acting on it |
| `--sl-intensity` | as above |

On material elements: `--sl-lx`, `--sl-ly` (pointer position in percent of the element, from -60 to 160). On `<html>`: `--sl-px`, `--sl-py` (pointer in pixels), `data-sl-captions="on"`, `data-sl-ready`. CSS `--sl-motion` is 1, or 0 under reduced motion: multiply travel by it.

## Writing a rehearsal

```css
/* The target answers the approach (0.35) and the hover (1), and grows with the hold. */
.card[data-sl-preview="delete"] .burn {
  --b: calc(var(--sl-rehearse) * var(--sl-intensity) * .1 + var(--sl-hold) * 1.15);
}
```

The stylesheet includes default previews for common verbs (delete, archive, send, copy, share, save, hide, lock, pin, favorite, publish, expand, restore). They use the individual `translate`, `rotate`, `scale` and `filter` properties so they never clobber a component's `transform`. Replace them with a bespoke rehearsal whenever you can.

## Events

All bubble, with `detail.verb`.

| Event | When |
|---|---|
| `sl:near` | the pointer enters the radius |
| `sl:rehearse` | hover, focus or touch-hold begins |
| `sl:leave` | rehearsal ends without commit |
| `sl:arm` | a heavy control got its first press (keyboard, screen reader, or a short click) |
| `sl:cancel` | a hold was released early, or an armed control timed out, lost focus or got Escape (`detail.reason`) |
| `sl:commit` | the action happens. A normal `click` fires at the same moment |
| `sl:hesitate` | the rehearsal lasted past `data-sl-hesitate` |
| `sl:phase` | `Stringless.phase()` changed a phase (`detail.from`, `detail.to`) |

For heavy controls, the click that reaches your handlers is the committed one; the arming click is stopped before it.

## JavaScript API

```js
Stringless.init({ radius, hold, armWindow, hesitate, peek, memory, captionKey, armHint, dev })
Stringless.refresh()                         // rescan, if you changed attributes in bulk

Stringless.verbs.shatter(el, { origin, tint: 'ash', gravity, duration })   // -> handle
Stringless.verbs.dissolve(el, { blur, rise, duration })                     // -> handle
Stringless.verbs.fold(el, { to, duration })                                 // -> handle
Stringless.verbs.travel(el, to, { arc, scale, spin, duration })            // -> Promise
Stringless.verbs.pour(fromEl, toElOrPoint, { color, count, interval })     // -> Promise
Stringless.verbs.ripple(el, { rings, scale, color })                       // -> Promise
Stringless.verbs.refuse(el)                                                 // shake no
Stringless.verbs.settle(el, { material, depth })                            // press into place
Stringless.verbs.crystallize(el, { color })                                 // one glint
// handle: await handle.restore() plays it back (undo); handle.finish() drops the copy

Stringless.remnant({ anchor, parent, material: 'ash', className, html, label, duration,
                     onRestore, onExpire, announceText, restoredText })    // echo + undo
Stringless.phase(el, 'wet' | 'dry' | 'frozen' | 'liquid' | 'vapor' | 'crystal' | 'cracked' | 'ash' | null)
Stringless.announce('Note restored.')       // polite live region

Stringless.captions.toggle() / show() / hide() / peek(el, ms)
Stringless.sound.enable() / disable() / toggle() / play(material, kind)
Stringless.haptics.enable() / disable() / toggle() / pulse('light' | 'medium' | 'heavy')
Stringless.fluency.get(verb) / reset()
Stringless.patina.get(id) / reset()

Stringless.physics.paper                    // { mass, stiffness, damping }
Stringless.springEasing('stone')            // { easing: 'linear(...)', duration }
Stringless.spring({ from, to, physics: 'rubber', onUpdate(value, velocity) })  // -> { retarget, stop, finished }
Stringless.reducedMotion                    // boolean
Stringless.stateOf(el)                      // current state of a control
```

Verbs respect reduced motion on their own. `shatter`, `dissolve` and `fold` hide or animate the original and return a handle, so an undo is one call.

## CSS

- Materials: `paper`, `ink`, `graphite`, `glass`, `metal`, `rubber`, `clay`, `liquid`, `ice`, `ember`, `ash`, `stone`, `cloth`, `wax`, `light`, `vapor`.
- Phases: `wet`, `dry`, `frozen`, `liquid`, `vapor`, `crystal`, `cracked`, `ash`.
- Springs: `--sl-ease-<material>` and `--sl-dur-<material>` for every physics preset.
- Textures: `--sl-grain`, `--sl-fiber`, `--sl-speckle` (SVG noise as data URIs).
- Colors: `--sl-paper`, `--sl-ink`, `--sl-ember` and the rest. Override them to match DESIGN.md.
- SVG filters injected once: `#sl-goo`, `#sl-heat`, `#sl-rough`, `#sl-crack`, `#sl-frost`.
- Helpers: `.sl-hit` (44px minimum hit area), `.sl-caption`, `.sl-remnant`, `.sl-tethers`.

## Behavior summary

- **Pointer**: proximity grows `--sl-near`; hover rehearses; leaving reverses.
- **Keyboard**: focus-visible rehearses; Enter and Space commit; heavy controls arm on the first press, announce "Press again to confirm", and commit on the second within 4 seconds; Escape and blur cancel. `?` toggles captions anywhere outside text fields.
- **Touch**: touch-hold rehearses; a long press on a light control shows its caption without committing; heavy controls commit when the hold completes.
- **Memory**: uses and hesitations per verb, and use counts per `data-sl-id`, persist in localStorage. `Stringless.init({ memory: false })` turns persistence off.
