# Forge

Design and build one stringless component, end to end. A component is one intent: one verb on one kind of object, or one input. A forge that tries to cover three intents makes three weak controls.

## 1. Pin the intent

Write one line before anything else:

> verb · object · weight · frequency · reversible? · who uses it, where

Example: `delete · note · heavy · a few times a week · yes, 7s · a writer clearing old notes at a desk`.

Read LEXICON.md. If the verb or the object already has an entry, the design must use it. If not, you are adding one, and step 6 records it.

## 2. Find the metaphor

1. Run `node <skill-dir>/scripts/roll.mjs --verb <verb> --object <object>`. Read its seeds and the `Tried` list.
2. Write three candidates in one line each. At least two must come from the roll or from the LEXICON world, not from the catalog. The catalog entry for this need is a baseline to beat, not a choice.
3. Score each from 1 to 3 on:
   - **Cold read.** Would a stranger guess the verb from the rest pose, or at worst from the rehearsal?
   - **World fit.** Does it belong in the product's world and lexicon?
   - **Newness.** Is it something they have not seen in an app?
   - **Parity.** Does it work with keyboard, touch and reduced motion without losing meaning?
   - **Cost.** Is it smooth on a mid-range phone?
4. Pick the highest total. Break ties toward cold read. Say in one line why it won.

If every candidate scores 1 on cold read, the intent is too abstract for a pure metaphor. Bind it harder (put the control on the target) or drop one rung on the signifier ladder.

## 3. Write the spec

Fill this table before coding. It is the component's contract.

| Stage | What the user sees and feels |
|---|---|
| Rest | silhouette, material, where it sits, what it's bound to |
| Approach | what wakes (on the control and on the target), how strongly, from how far |
| Rehearse | the first part of the effect, on the real target. What reverses on leave |
| Commit | the gesture and its weight; how the effect continues from the rehearsal |
| Echo | where the result lands, what trace stays, how long, and how to undo |
| Memory | what changes for a fluent user (`--sl-intensity`) and with wear (`--sl-wear`) |
| Still | the reduced-motion version, with the same meaning |
| Keyboard | focus shows approach and rehearsal; Enter or Space commits; heavy is press twice; Escape cancels |
| Touch | touch-hold shows the rehearsal; a hold or a second tap commits heavy actions |
| Screen reader | role, accessible name, state, and what gets announced after commit |
| Caption | the text shown by `?`, a long press, or hesitation (usually the accessible name) |
| Sound | optional: the material's commit sound, opt-in |

Then the five answers in one line each: what it is, what it touches, what it will do, what it costs, where it is in time.

## 4. Build

Work in this order, so each layer stands without the next:

1. **Semantics.** A real `<button>`, `<input>`, `<a href>` or the right role, with an accessible name. This works with no CSS and no script.
2. **Form.** Silhouette, hit area, focus ring that follows the shape.
3. **Material.** `data-sl-material` or custom surfaces. Light response. Phases with `data-sl-phase`.
4. **Binding.** `data-sl-target` so the target reacts; `data-sl-tether` or `data-sl-lean` when the target is far.
5. **Motion.** Rehearsal styles on the target's `[data-sl-preview="<verb>"]` using `--sl-rehearse` and `--sl-hold`. Commit with the runtime verbs or your own Web Animations. Echo with `Stringless.remnant` or your own trace.
6. **Weight.** `data-sl-weight="heavy"` and `data-sl-hold` for hold-to-commit with press-twice fallback.
7. **Memory and sense.** `data-sl-id` for patina; sound and haptics come from the material once the user enables them.

Install the runtime with `node <skill-dir>/scripts/install-runtime.mjs` if it's not in the project yet. See [runtime.md](runtime.md). Go past it whenever the concept needs SVG filters, canvas, WebGL, View Transitions or `@property`, and give each a fallback that keeps the meaning.

Framework notes:
- **React, Vue, Svelte, Solid.** Put the data attributes on the element; the runtime watches the DOM, so components that mount later work without extra code. Listen for `sl:commit` on the element or call your handler from `onClick`, which fires on commit.
- **Server-rendered pages.** Add the two files once in the layout.
- **Design systems.** Build the component once with its variants (weight, material) and record it in LEXICON.md.

## 5. Verify

Bounded: build fully, inspect once, fix in one batch, confirm once more at most.

1. Serve the page (`node <skill-dir>/scripts/serve.mjs <dir>` for static files) and capture: rest, approach, rehearse, mid-commit, echo. Then keyboard focus, the armed state for heavy actions, touch emulation, reduced motion, and a 375px-wide viewport.
2. Interrupt every motion: approach another target mid-rehearsal, commit mid-rehearsal, commit again mid-commit, and leave mid-rehearsal. Nothing may jump; each new motion continues from where the last one was. Then use every gesture with mouse, touch and keyboard: a tap, a press-and-drag, and each shortcut. Each gives exactly one result.
3. Check the result against the spec table, row by row.
4. Run `node <skill-dir>/scripts/stringcheck.mjs <files>` and fix every error.
5. At strangeness 3 or more, run [guess](guess.md) on the rest and approach screenshots.

## 6. Record

Add to LEXICON.md: the object's material, the verb's choreography and weight, any new phase or direction, and the accessible name. Add the winning metaphor and the two losers to `Tried`, so the next roll avoids them.

## Quality bar

A forged component is done when:

- a stranger reads it at rest or on approach, without a word on screen
- the rehearsal plays on the real target, and leaving undoes it completely
- it carries one idea
- the echo is visible where the effect landed, and it's the way back for heavy actions
- the 50th use is quicker and quieter than the first and still pleasant
- it runs smoothly on a phone, and nothing moves at rest

## Report

One block per component: the five answers, gesture and weight, echo and undo, lexicon changes, what was verified (with screenshot paths), and what wasn't.
