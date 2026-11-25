# Form

Form answers "what is it?" and "how do I use it?" at a glance. The rounded rectangle says only "press here". A stringless shape says what will happen when you do.

## Shape grammar

| Form | Reads as | Example |
|---|---|---|
| a part of the object (corner, edge, seam, lip) | acts on this object | a charred corner on a card burns that card |
| a handle (knob, tab, pull, lever) | move me in the direction I suggest | a tab sticking out of a drawer pulls the drawer |
| a vessel (cup, jar, tray, pocket) | holds things, and its fill is the amount | a jar that fills with sand as the storage fills |
| a slot or a mouth | put things in here | a mail slot that accepts dragged items |
| a tool (stamp, blotter, scissors, eraser, needle) | does its job to whatever it touches | a stamp that approves the form it presses |
| a token (coin, pebble, marble, tile) | a choice you can pick up and place | marbles in cups for single choice |
| a mechanism (dial, latch, crank, hinge) | changes state by turning or swinging | a latch that locks a section |
| a living thing (seed, bud, egg) | will grow, and is in progress | a seed for a long-running job |
| a portal (window, door, hole, fold) | leads somewhere else | a dog-eared corner that peels to the next page |

## Rules

- **Surface-native first.** Before adding a control, ask whether the target can carry the action. A card's corner, a list item's edge, a photo's frame and a paragraph's margin are all controls in waiting. A detached button is the fallback.
- **Count shows quantity.** Five unread messages are five envelopes in a stack, a thicker drawer, a heavier pile. Use digits when the exact number matters (see the floor).
- **Size shows importance and reach.** The control's size and weight match the size of the consequence. A small notch never deletes a whole account.
- **Shape carries state.** Open and closed, full and empty, taut and slack, whole and broken. A state change should change the silhouette, not only the color.
- **Morph to show the next step.** A control that starts an action can become the action: a send button becomes the plane, a download button becomes the progress vessel. Use View Transitions or SVG path morphing.
- **Grip shows the gesture.** Knurling invites turning, a ridge invites sliding, a dimple invites pressing, a lip invites pulling, a frayed edge invites tearing.
- **Stack signifiers in one shape.** A slider whose track is a ruler, whose thumb is a magnifier and whose bar thickens with value says three things without three labels.

## Hit areas

Odd shapes still need easy targets.

- Minimum 44 by 44px. When the visible shape is smaller, extend it with an invisible `::before` (runtime class `.sl-hit`).
- Concave and diagonal shapes take a rectangular hit area covering the whole visible shape.
- Focus rings follow the shape: `outline` with `border-radius`, or a drawn ring for clipped shapes. Never remove focus rings.
- Touch targets keep 8px of space from neighbors.

## Making shapes

| Need | Technique |
|---|---|
| irregular silhouettes | `clip-path: polygon()` or `path()`, or inline SVG |
| organic edges | SVG paths with slight noise; `feTurbulence` displacement on edge layers |
| shape morphs | SVG path interpolation with matching point counts; `clip-path` transitions; View Transitions |
| 3D forms | layered gradients and shadows for small objects; CSS 3D transforms for folds and flips; WebGL for real depth |
| a stack of things | repeated elements with jittered rotation and offset, capped and summarized beyond a count |
| shapes from data | generate SVG paths in script from the data so the form is the information |

## Avoid

- The same rounded rectangle with a texture on it. That's a skin, not a form.
- Icons inside shapes. If the shape needs an icon to explain itself, rework the shape.
- Novel shapes for standard affordances that already work, like a text cursor or a scrollbar, unless the strangeness level calls for it.
