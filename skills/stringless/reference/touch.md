# Touch

A finger is not a small mouse. It can't hover, it covers what it presses, a whole hand comes with it, and the browser wants long presses, double taps and swipes for itself. Give every control a touch version in the same metaphor, designed as carefully as the pointer version. Phones are half the audience, not a fallback.

## The intent ladder under a finger
| Stage | Pointer | Touch |
|---|---|---|
| Rest | quiet; approach adds meaning later | carries more of the meaning, because nothing approaches: a visible seam, a resting lean, a material that already looks like its verb |
| Approach | the pointer nears (`--sl-near`) | the first view: the runtime plays a short approach glow once per verb, the first time it is on screen, until the user knows the verb |
| Rehearse | hover or focus | touch-down: the preview starts the moment the finger lands, and reverses if it lifts early or the drag turns into a scroll |
| Commit | click, hold, press twice | release on the control; a hold for heavy; or a tap that arms, then a hold or a second tap |
| Echo | the remnant | the same remnant, placed where the hand isn't |
| Caption | `?` or lingering | a long press, shown above the finger |

## What the finger takes away
- **Hover.** A tap triggers `:hover` and leaves it stuck until the next tap. Put hover-only styles inside `@media (hover: hover)`, and give every hover reveal a touch twin.
- **Sight.** The fingertip covers the control, and the hand covers everything below it. Show the rehearsal on the target, or above and beside the contact point. A preview that only happens under the fingertip is a preview nobody sees.
- **Precision.** A fingertip covers about 7mm, not a point. Keep hit areas at least 44 by 44px (48 is better) and 8px apart; use `.sl-hit` for small or odd shapes. Treat a wobble under 10px as still.

## What the finger brings
Touch can say things a mouse can't. Use them, and give each one a plain tap or keyboard path too.
- **Where it lands.** The effect starts at the contact point: the burn starts under the fingertip, the ripple spreads from it, the crack runs from it. The runtime moves the light to the touch point.
- **How long it stays.** On a phone, pressure is time. A hold charges heavy actions, and a longer press can push a preview further.
- **Which way it moves, and how fast.** A drag previews a throw and a flick commits it: a slow pull shows the card heading for the archive, a fast flick sends it there. Release speed decides commit or return, and a card that returns springs back from where the finger left it.
- **How the phone tilts.** On a phone the light comes from the world. `Stringless.light.tilt()`, called from a tap, moves material light with the phone's tilt (iOS asks permission once; it stays off under reduced motion). Glass glints as you tilt, a marble tray tips, a liquid stays level. Tilt decorates and teaches; it never carries the only path.
- **Two fingers.** Pinch to compress or zip, spread to unfold, twist a dial.
- **A pen.** `PointerEvent.pressure` is real for a pen and usually a constant 0.5 for a finger. A pen can hover on some tablets, so it approaches like a mouse.
- **A buzz.** `navigator.vibrate` works on Android only. A pulse confirms what the user already sees; it never carries meaning alone ([sense](channels/sense.md)).

Drags, flicks, sweeps and two-finger gestures each need a single-tap path as well (WCAG 2.5.1). And a gesture needs a signifier like any control: something at rest or on first view has to suggest it.

## What the browser takes for itself
- **Double tap zooms.** `touch-action: manipulation` stops that, so press-twice works. The runtime sets it on `[data-sl-verb]`.
- **Long press selects text or opens a menu.** The runtime turns off text selection and the iOS callout on controls. Keep text people may want to copy outside pressable elements.
- **Drags scroll the page.** For a sideways drag in a scrolling page, use `touch-action: pan-y` so vertical scrolling still works, and `touch-action: none` only on a small handle. Capture the pointer while dragging. A drag the browser turns into a scroll fires `pointercancel`: treat it as cancel, never as commit.
- **Edges belong to the system.** The side edges are back and forward swipes and the bottom edge is the home bar. Start drags well inside the screen and keep controls inside `env(safe-area-inset-*)`.
- **Scrolling stays free.** Only passive `touchmove` listeners on scrolling content. Never hold up a scroll to run an effect.
- **The keyboard covers half the screen.** Controls tied to a text field must stay reachable while typing: use `visualViewport`, or `interactive-widget=resizes-content` in the viewport meta tag.

## Reach
Phones are held in one hand. Frequent and light actions sit in the bottom third, under the thumb. Heavy and destructive ones can sit higher, where reaching up is part of the cost. Test at 360 to 430px wide, in both orientations. When Impeccable is installed, its `adapt` command handles layout across screen sizes; this file covers what happens under the finger.

## Phones are slower
A mid-range phone has a fraction of a laptop's GPU. Under `(pointer: coarse)`, halve blur radii and displacement areas, keep `backdrop-filter` off large surfaces, and keep shard counts low. See [staying smooth](channels/motion.md#staying-smooth).

## Verify on touch
1. Use Chrome's device toolbar with touch, then a real phone: run `node <skill-dir>/scripts/serve.mjs <dir> --host 0.0.0.0` and open the computer's local IP address on the phone, at the same port.
2. For each control: tap; long press (caption above the finger, no commit, no selected text); press and drag into a scroll (it cancels); double tap a heavy control (no zoom, and it commits); drag inside a scrolling page (the page still scrolls); and each touch gesture next to its tap path.
3. Capture the rest state at 390px wide, with no hover at all, and run [guess](guess.md) on it. On touch, rest has to carry the meaning.
