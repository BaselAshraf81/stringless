---
name: stringless
description: Design and build interface components that explain themselves without text labels, through material, motion, form, physics, space and time. Use when the user wants label-free, self-descriptive, experimental or never-seen-before UI; buttons, toggles, inputs, menus or states whose look and behavior show what they do; kinetic or material-driven interaction; or says stringless, unstring, no labels, motion art, or "make it explain itself". Also use to convert a labeled UI to stringless, to build a product's material and motion lexicon, to wireframe a surface as a stage, to run a cold-read legibility test, or to audit stringless components for accessibility, reduced motion and touch or keyboard parity. Web-first with a bundled zero-dependency runtime; the method maps to SwiftUI, Compose and Flutter.
license: MIT
metadata:
  author: Basel Ashraf
  version: "0.2.0"
  homepage: https://github.com/BaselAshraf81/stringless
---

# Stringless

Most controls are the same rounded rectangle, so a word has to say what each one does. Stringless moves that meaning out of the label and into the control: what it is made of, what it touches, how it moves, what it costs, and where it is in time. The goal is interface parts that people understand by looking, approaching and touching, and that feel like nothing they have used before.

You are the inventor here, not a template filler. Treat every control as a small physical event that has never been designed before. `<skill-dir>` below is the folder that holds this file (`${CLAUDE_SKILL_DIR}` in Claude Code).

## Five questions

Every stringless control answers these without words, before the user commits:

| Question | Channel | Example |
|---|---|---|
| What is it? | material, form | a sheet of paper is a document thing |
| What does it touch? | space | the card it sits on wakes up as you approach |
| What will it do? | motion | the card starts to char at the corner: it will burn |
| What does it cost? | physics | you hold it while the heat builds; ash stays behind for undo |
| Where is it in time? | phase | unsaved text is wet ink, saved text is dry |

A word on a control means one answer is missing. Find it, or accept that the word is content (see the floor).

## The signifier ladder

Climb as high as the design allows. Each rung down asks the user to know more beforehand.

1. **Enactment.** The control previews its effect on the real target. Needs no prior knowledge.
2. **Binding.** It sits on, points at, or reacts with the thing it affects. Needs only proximity.
3. **Matter.** Material and shape borrowed from the physical world. Needs life experience.
4. **Symbol.** An icon. Needs UI conventions.
5. **Word.** A label. Needs the language.

Rungs 4 and 5 live in the caption layer as fallbacks. They are never the design.

## The intent ladder

A control reveals more as the user gives it more attention:

0. **Rest.** Silhouette and material say the domain. Still, unless the state needs the user.
1. **Approach.** The pointer nears or focus lands. The control wakes, leans toward its target and catches the light. The target is marked.
2. **Rehearse.** Hover, focus or touch-hold. The target plays the first part of the effect and holds it there. Leaving plays it backwards. Nothing has changed yet.
3. **Commit.** The gesture fits the weight: tap for light actions, hold or press twice for heavy ones. The motion continues from wherever the rehearsal stands.
4. **Echo.** The result lands where the rehearsal promised. A remnant stays for a while and is the way back.
5. **Memory.** Rehearsals shorten for verbs the user knows, return when they hesitate, and wear shows what gets used.

## Strangeness

Each surface gets a strangeness level from 1 to 5, recorded in LEXICON.md. Default 3.

1. Familiar control with one stringless channel added, usually a rehearsal.
2. Familiar layout. Material, binding and phases carry the meaning.
3. New metaphors that one approach teaches.
4. Objects instead of controls. The surface is a scene.
5. Art piece: exhibitions, portfolios, play. Discovery is the point.

Spend strangeness where people have time and reason to learn: daily tools, creative apps, showcases. Keep it low on one-time, stressful or payment flows.

## Stance

- Ask what the action would be if it happened on a desk, in a kitchen, a workshop, a post office, or in weather. Then make that event small, quick and reversible.
- Let the target do the talking. The best control is often a part of the object (a corner, an edge, a seam, a lip) rather than a separate button.
- Borrow from crafts, machines and natural phenomena, not from other apps. Anything you have seen in an app is a starting point at best.
- The metaphor must survive a cold read. Clever and unreadable fails. Strange and readable is the target.
- One idea per control. Stack channels to say one thing louder, never to say five things.

## The floor

These hold at every strangeness level. Build to them without announcing them.

1. **Silent to the eye, fluent to the ear.** Every control has a role and an accessible name. The name also feeds the caption layer.
2. **Strings on demand.** Pressing `?`, long-pressing, or lingering shows the caption. Users can turn captions on for good.
3. **Parity.** Whatever a pointer approach reveals, keyboard focus and touch-hold reveal too. Meaning that needs hover is a bug. It runs both ways: every key action, such as Escape to dismiss, also has a pointer and touch gesture.
4. **Rehearsals are previews.** Visual and reversible only: no data change, no network write. Leaving, blur and Escape cancel them.
5. **Weight matches consequence.** Heavy actions take a hold, with press-twice as the alternative, and leave an echo when the action can be undone. Irreversible actions say so through brittle materials and by leaving no remains.
6. **Reduced motion keeps the meaning.** Replace travel with a state change in place plus a brief highlight. Never just delete the animation.
7. **Calm at rest.** No idle loops unless a state needs the user, and those settle once it resolves.
8. **One lexicon.** A material, verb or phase means one thing across the product, recorded in LEXICON.md.
9. **Content keeps its words.** User data, names, numbers, prices, dates, legal text and error explanations stay text. Stringless removes chrome labels, never information.
10. **Smooth.** 60fps on a mid-range phone. Animate transform and opacity, keep filters small, never write inheriting per-frame variables on `<html>` or `<body>`, and pause work that is off screen. See [staying smooth](reference/channels/motion.md#staying-smooth).
11. **Reachable.** Hit areas stay at least 44 by 44px even when the visible shape is small or odd. Focus rings follow the shape.

## Setup

1. **Context.** Look for `PRODUCT.md`, `FEATURES.md` and `LEXICON.md` in the project root, then in `docs/`. Read what exists.
   - PRODUCT.md may come from another tool such as Impeccable. Read it and never overwrite it. Create it only when it is missing.
   - DESIGN.md, when present, binds palette, type and spacing. Stringless adds behavior and meaning, not a new brand.
   - No context and the task is bigger than one component: run `init` first. A single component: infer, build, then offer `init`.
2. **Roll.** Before inventing any new concept (forge, dream, or a non-trivial unstring), run `node <skill-dir>/scripts/roll.mjs --verb <verb> --object <noun>`. Use at least one seed, or say in one line why you rejected each. The roll exists because models converge on the same few ideas. Without Node, open `<skill-dir>/scripts/data/seeds.json` and pick entries using the digits of the current time. Also read the `Tried` section of LEXICON.md so you do not repeat yourself.
3. **Playbook.** Load the command's reference from the table below. Load only the channel and catalog files it names.
4. **Before UI code.** Read [reference/slop.md](reference/slop.md). When using the runtime, read [reference/runtime.md](reference/runtime.md).

## Commands

| Command | What it does | Playbook |
|---|---|---|
| `init` | Learn the product. Write PRODUCT.md if missing, and FEATURES.md | [init](reference/init.md) |
| `lexicon` | Build or extend LEXICON.md: what each material, verb, weight and phase means in this product | [lexicon](reference/lexicon.md) |
| `map [surface]` | Inventory every visible string and action on a surface and turn each into an intent | [map](reference/map.md) |
| `stage [surface]` | Wireframe a surface as a stage: objects, controls, bindings, reach and forces | [stage](reference/stage.md) |
| `forge [intent]` | Design and build one new stringless component end to end | [forge](reference/forge.md) |
| `unstring [target]` | Convert an existing labeled UI to stringless without changing what it does | [unstring](reference/unstring.md) |
| `dream [target]` | Three concepts at rising strangeness from a fresh roll. No code until one is chosen | [dream](reference/dream.md) |
| `guess [target]` | Cold-read test: a reader who sees only pixels predicts what each control does | [guess](reference/guess.md) |
| `audit [target]` | Floor checks: names, keyboard, touch, reduced motion, performance, string detector | [audit](reference/audit.md) |
| `tune <channel> [target]` | Deepen one channel (material, motion, form, space, time, sense) on an existing component | [tune](reference/tune.md) |

Routing:

- **No argument.** Show the table. Lead with two or three recommendations: `init` when FEATURES.md is missing, `lexicon` when LEXICON.md is missing, `map` or `unstring` for surfaces with many labeled controls (run `node <skill-dir>/scripts/stringcheck.mjs --inventory <src>` for counts), `guess` for stringless work that was never cold-read. Never auto-run a command.
- **First word is a command.** Run its playbook. A channel name as the first word means `tune <channel>`.
- **Plain request.** Something new: `forge`. Something labeled that exists: `unstring`. Ideas, options, "go wild": `dream`. "Does this make sense": `guess`. Checks, accessibility, performance: `audit`. A whole app: `init`, then `map` and `stage` per surface.

## Channels and catalog

Channels are how a control speaks. Load the ones the design uses:

| File | Covers |
|---|---|
| [channels/material.md](reference/channels/material.md) | The material lexicon: meaning, look, light, physics and sound for each material, plus collisions and inventing new ones |
| [channels/motion.md](reference/channels/motion.md) | Verbs as motion: rehearsal, commit, echo and still for each verb; timing by weight; direction rules; staying smooth |
| [channels/form.md](reference/channels/form.md) | Shape grammar: count as quantity, surface-native controls, vessels, mechanisms, morphing, hit areas |
| [channels/space.md](reference/channels/space.md) | Binding and tethers, proximity, reach, gravity, depth, spatial continuity |
| [channels/time.md](reference/channels/time.md) | Phases of matter as state, echo windows, rewind, fluency and hesitation, patina, waiting |
| [channels/sense.md](reference/channels/sense.md) | Opt-in sound and haptics per material and weight |

The catalog holds starting concepts for common needs. They are starting points, not templates: roll first and push past them.

| File | Covers |
|---|---|
| [catalog/actions.md](reference/catalog/actions.md) | Save, send, delete, archive, copy, share, export, download, upload, undo, publish, schedule, lock, pin and more |
| [catalog/inputs.md](reference/catalog/inputs.md) | Toggles, single and multiple choice, sliders, steppers, text fields, files, consent |
| [catalog/navigation.md](reference/catalog/navigation.md) | Tabs, back, menus, breadcrumbs, pagination, dialogs, drawers, settings, search |
| [catalog/feedback.md](reference/catalog/feedback.md) | Loading, progress, success, error, empty, disabled, notifications, sync, presence |
| [catalog/ai.md](reference/catalog/ai.md) | Generate, rewrite, summarize, translate, explain, suggestions, confidence, agent activity |

## Building

- **Runtime.** `<skill-dir>/assets/runtime/` holds `stringless.js` and `stringless.css`: proximity fields, rehearsal states, target previews, weighted holds, tethers, material light, springs, verbs (shatter, dissolve, fold, travel, pour, ripple, refuse, settle, crystallize), fluency, hesitation captions, patina, opt-in sound and haptics, and announcements. It is plain data attributes plus CSS variables, so it works with any framework. Install it with `node <skill-dir>/scripts/install-runtime.mjs`. API: [reference/runtime.md](reference/runtime.md).
- **Custom.** The runtime is the floor, not the ceiling. Reach for SVG filters, clip-path and masks, `@property`, `linear()` springs, View Transitions, canvas, WebGL or WebGPU whenever the concept needs them, with a fallback that keeps the meaning.
- **Examples.** `<skill-dir>/assets/examples/` holds six working components, each with its five answers in a comment at the top: `wet-ink-save` (save), `ember-delete` (heavy delete with ash undo), `frost-privacy` (switch), `marble-choice` (single choice), `vapor-suggest` (AI suggestions), `paper-export` (export with real files). Read one to calibrate the quality bar. Don't copy its metaphor unless the lexicon assigns it.
- **Native.** SwiftUI, Jetpack Compose, Flutter or React Native: read [reference/native.md](reference/native.md). The runtime is web-only.
- **Other design skills.** When Impeccable or a similar skill is installed, it owns the visual world, typography and layout. Stringless owns how controls express intent. Follow DESIGN.md for palette and type.

## Verify

Verify in bounded passes. Build fully, then inspect once in a batch, fix everything that batch shows, confirm with at most one more round, and stop.

- Capture each control at rest, approach, rehearse, commit and echo. Do a keyboard pass, touch emulation and reduced motion.
- Run `node <skill-dir>/scripts/stringcheck.mjs <changed files or folders>` and fix errors.
- Run `guess` on anything at strangeness 3 or higher when screenshots are possible.

## Report

Keep it short. For each control: its five answers in one line, the gesture and weight, and the echo. Then list lexicon entries added or changed, what was verified, and what was not.
