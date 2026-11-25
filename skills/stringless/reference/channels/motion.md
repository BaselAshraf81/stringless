# Motion

Motion answers "what will it do?" A stringless verb is a short piece of choreography with four parts, and the user should be able to read the verb from the first part alone.

| Part | When | Rule |
|---|---|---|
| Rehearsal | approach, hover, focus, touch-hold | the first 10 to 30 percent of the real effect, on the real target, held still. Reverses on leave |
| Commit | the gesture completes | continues from wherever the rehearsal stands. Never restarts from zero |
| Echo | after | lands where the rehearsal pointed and leaves a trace for a while |
| Still | reduced motion | the same meaning with no travel: a state change in place plus a short highlight |

## Verbs

Starting choreography. LEXICON.md can reassign any verb; then the whole product follows it.

| Verb | Rehearsal | Commit | Echo | Still |
|---|---|---|---|---|
| save | wet content glistens harder; the saving tool leans toward it | blot, press or seal; wet turns matte | a dry, matte surface and a mark of the save (imprint, seal) | ink switches to dry with a brief sheen |
| delete | the target starts to char, crack or fade at the corner nearest the control | burn, shatter or dissolve | ash or shards that undo for a while | target dims to ash color; ash remnant appears |
| archive | the target pales and slides a little toward the archive | folds or slides into a drawer, box or layer | the archive bulges slightly or shows a count | target fades; archive count ticks |
| send | the item lifts and tilts toward the destination; the destination opens | folds into a plane, envelope or capsule and travels | a delivered mark at the destination, a light trail | item marked sent in place |
| copy | a ghost copy peels a few pixels off the original | the ghost flies to the clipboard or drop point | a ghost stays on the clipboard object | clipboard object flashes |
| share | rings or copies start to spread from the item | ripples outward to recipients | recipients glow briefly | recipients marked |
| export | the item shows its future form: a printed sheet slides halfway out | the sheet completes and drops into a tray or file | the file sits where the tray is | file appears |
| download | the item lowers toward a container, which opens | it drops in; the container fills | the container is heavier, with a count | container count ticks |
| upload | the file lifts off the ground | it rises into the cloud, slot or tube | the destination glows | destination marked |
| undo | the last change shows a ghost of its previous state | time rewinds: the change plays backwards | the earlier state, plus a trace that the rewind happened | swap in place |
| refresh | the content shudders like a page about to turn | the content turns over or drains and refills | new items are wet or lit for a moment | brief highlight on changed items |
| expand | the container breathes outward by a few pixels | it opens along its seam | contents settle | open state |
| collapse | contents gather toward the seam | they fold in | the closed object is a little thicker when it holds more | closed state |
| lock | the shackle drops a few pixels; the content stiffens and desaturates | the shackle clicks shut; the content gets a frost or metal skin | a lock glyph is pressed into the surface | lock state |
| pin | the item stops drifting and its shadow tightens | a pin presses in | the item ignores scroll physics | pinned state |
| publish | the item lifts and gathers light | it rises onto a public layer (a stage, a sky, a wall) | a halo stays while it's public | public state |
| schedule | the item drifts toward a slot in time | it settles into the slot | a small clock face on the item | scheduled state |
| reorder | the item lifts with a stronger shadow | it slides; neighbors part around it | neighbors settle with a little overshoot | swap |
| merge | two items lean together and their edges blur | they flow into one (goo filter) | the result keeps a seam | merged state |
| split | a crack line appears where the split will be | it breaks apart along the line | two items with matching edges | split state |
| connect | a thread starts from the control toward the other thing | the thread goes taut and ties | a visible link | link state |
| disconnect | the thread frays | it snaps and the ends recoil | loose ends for a moment | unlinked state |
| retry | the failed item tilts back like a wound spring | it springs forward | a fresh state | fresh state |
| cancel | the in-progress thing slows and dims | it unwinds back to where it started | the start state | start state |
| confirm | the choice gets heavier | it settles (runtime `settle`) | the chosen thing stays heavier | heavier state |
| refuse | (none) | shake "no" (runtime `refuse`) | the cause is marked | outline flash |

## Choreography rules

- **Preview the start, not the end.** A rehearsal shows the beginning of the effect, held. Showing the finished result is a false promise when the user hasn't decided yet.
- **One axis, one meaning.** Pick directions once for the product and record them: for example right means forward or send, left means back or undo, down means keep or save, up means publish, into the depth means archive, out of the depth means restore.
- **Continuity.** An object never teleports. When it moves to another place on screen, it travels or morphs there (View Transitions, `travel`). Users follow things they see move.
- **Cause first.** The control moves first, then the target answers. A wave that starts at the cursor and arrives at the target explains the cause.
- **Interruptible.** Every commit can be reversed or redirected mid-flight when the action allows it. Use springs and the Web Animations API (`reverse()`), not fixed CSS keyframes, for anything a user can interrupt.
- **Motion lands in a place.** The end state must be stable, visible and findable: the sent envelope in the outbox, the ash where the card stood.

## Timing by weight

| Weight | Rehearsal reach | Commit | Gesture | Echo window |
|---|---|---|---|---|
| light | 10 percent, 120 to 180ms in | 180 to 320ms | tap or click | none, or a brief highlight |
| medium | 20 percent, 200ms in | 320 to 600ms | tap, the effect plays fully | a trace of 2 to 3 seconds |
| heavy | 30 percent, then grows with the hold | 600 to 1200ms | hold 900 to 1400ms, or press twice | undo remnant for 5 to 10 seconds |

Rehearsals fade out in 150 to 250ms when the pointer leaves. Commits use material springs (`--sl-ease-*`), so a stone settles differently from paper.

## Easing

- Use the material's spring: `--sl-ease-paper`, `--sl-ease-metal` and the others, or `Stringless.springEasing(preset)` in script.
- Exponential ease-out for things that arrive, ease-in for things that leave, no easing for things carried by a finger.
- No default `ease` and no symmetric ease-in-out on arrivals. They feel like software.

## Fluency

The runtime sets `--sl-intensity` from 1 (new user) down to 0.4 (frequent user) per verb, and back to 1 when the user hesitates. Multiply rehearsal amplitude by it. People who know a verb get a quieter control; people who are unsure get a louder one.

## Reduced motion

`prefers-reduced-motion: reduce` sets `--sl-motion: 0`. Multiply every travel distance by it. The runtime's verbs fall back on their own. Keep:

- color, opacity, texture and phase changes
- the echo and the remnant
- short highlights under 200ms

Remove:

- travel, rotation, scaling over 2 percent, parallax and bounce
- idle loops

The meaning must survive. A reduced-motion save still turns the ink matte, and a reduced-motion delete still leaves the ash.
