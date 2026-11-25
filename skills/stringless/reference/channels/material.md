# Material

Material answers "what is it?" before anything moves. People know from life that paper can be written on, folded and burned, that glass breaks, that metal is permanent and rubber springs back. Borrow those expectations on purpose, and never use a material for its looks alone.

## A material is five things

| Part | Question | Example (wax) |
|---|---|---|
| Meaning | What does this product say when it uses it? | sealed, committed, official |
| Look | Surface, edge, texture, how it takes light | deep red, glossy rim, matte pressed center |
| Light | How it answers a moving light (`--sl-lx`, `--sl-ly`) | a soft round highlight that slides |
| Physics | Mass, stiffness, damping (spring preset) | heavy, slow, no bounce |
| Sound | What it says when touched (opt-in) | a soft low press |

If you can't fill all five, you don't understand the material yet. Record each one in LEXICON.md.

## The lexicon

Starting meanings. The project's LEXICON.md wins over this table.

| Material | Usual meaning | Verbs it suits | Look and light | Physics | Phases |
|---|---|---|---|---|---|
| paper | documents, drafts, anything you can write on, fold, tear or post | write, fold, send, export, print, archive, burn | fibers and grain, soft wide highlight, deckled or cut edge | light, quick, a little flutter | wet ink, dry ink, folded, torn, charred |
| ink | content that is being committed: unsaved when wet, saved when dry | save, sign, write | deep blue-black, a sheen that follows the light while wet, matte when dry | slow spread, no bounce | wet, dry, blotted |
| graphite | provisional marks: drafts, suggestions, guesses | suggest, sketch, erase | gray hatch, smudges, soft shine | light, smears | sharp, smudged, erased |
| glass | visibility and fragility: privacy, previews, things that can break | reveal, hide, preview, break | edge highlights, refraction, frosting | stiff, rings | clear, frosted, cracked, shattered |
| ice | frozen: paused, locked for a while, read-only with a thaw | pause, freeze, thaw | blue-white, speckle, inner glow | brittle, slides | solid, melting, water |
| metal | permanent, secure, mechanical: locks, money, settings that matter | lock, confirm, toggle (switches and levers) | brushed lines, a sharp highlight that tracks the light | heavy, damped, clicks into detents | polished, scratched, rusted |
| stone | immovable and final: things that won't change | engrave, settle, anchor | speckle, chipped edges, almost no shine | very heavy, no bounce | intact, chipped, cracked |
| rubber | forgiving and bouncy: retry, refresh, playful toggles | bounce, stretch, snap back | matte, soft edge highlight, squashes on press | springy | relaxed, stretched |
| clay | editable and shapeable: drafts you can mold, options you can change | shape, mold, adjust | matte, thumbprints from use | soft, keeps dents | soft, firm, fired |
| liquid | flowing quantities: volume, progress, transfers, mixing | pour, fill, drain, mix | depth, meniscus, caustics | sloshes | still, sloshing, frozen, evaporating |
| cloth | covering and softness: drawers, curtains, sheets over hidden content | cover, uncover, wrap, drape | weave, folds, soft shadow | very light, drapes | flat, draped, crumpled |
| wax | sealing: commit, sign, final submit | seal, stamp, sign | glossy rim, pressed center, a crack when broken | heavy, a soft press | soft, sealed, broken seal |
| ember | destruction that takes a moment: delete, burn, clear | burn, char | char, glowing seams, heat shimmer | builds slowly, can cool | glowing, charred, ash |
| ash | what is left, and the way back: undo windows | restore, scatter | gray speckle, cooling embers | almost weightless | warm, cool, gone |
| light | attention, availability, presence, the active thing | glow, focus, call | bloom, no edge | massless | lit, dim, flickering |
| vapor | temporary or ghosted: previews, pending, things that may vanish | appear, vanish, condense | blur, drift | floats | condensing, clear, gone |
| seed / plant | growth, things in progress that grow by themselves | plant, grow, wither | organic edges | slow | seed, sprout, bloom, wilted |
| thread / string | links, dependencies, connections | tie, link, cut, pull | fiber, tension sag | tension | slack, taut, cut |
| magnet | snapping, attraction: alignment, grouping, docking | attract, repel, dock | field lines when near | pulls with distance | on, off |
| sand | time and erosion: countdowns, expiring things | run out, scatter, smooth | grain | flows | full, running, empty |

The runtime ships `data-sl-material` styles for paper, ink, graphite, glass, metal, rubber, clay, liquid, ice, ember, ash, stone, cloth, wax, light and vapor. The others need custom work; see `runtime.md`.

## Rules

- **One material, one meaning.** If glass means privacy, a glass button can't mean "preview" somewhere else. A material can carry several verbs that share its meaning: paper folds, posts and burns.
- **Don't pick by mood.** "Glass looks premium" is how glassmorphism became slop. The question is what the material does.
- **Show the material through what it does.** A paper texture that never folds, tears, takes ink or flutters is a costume. At least one behavior per material must appear somewhere in the product.
- **Light makes it real.** A texture under fixed lighting looks printed. Let the highlight follow the pointer or the device tilt. Touch: the last touch point. Keyboard: a fixed key light from the top left.
- **Keep data readable.** Texture goes under text at low contrast. Body text on a textured surface still meets 4.5:1.
- **Physical colors stay physical.** Paper is not black in dark mode. Put paper on a dark desk instead. A dark theme changes the world around the objects, not the objects.

## Collisions

Material meets material for the moment of commit. These pairs are understood without explanation:

| Pair | Reads as |
|---|---|
| wax + paper | seal, sign, final |
| ink + paper | write, save, sign |
| ember + paper | delete, burn |
| blotter + ink | save (dry the ink) |
| water + ink | dissolve, discard a draft |
| hammer + glass | break, force |
| key + metal | lock, unlock |
| stamp + paper | approve, mark, date |
| scissors + thread | unlink, cancel a subscription |
| magnet + metal | snap, attach |
| frost + glass | hide, private |
| breath + glass | reveal, temporary |
| sun + ice | thaw, resume |
| seed + soil | start a long job |

## Inventing a material

Allowed, and better than a weak borrowed one. A new material needs:

1. A real-world anchor the user can guess from (a "thought bubble" is soap film; a "sync" is a tide).
2. All five parts filled in.
3. At least one behavior no existing entry has.
4. An entry in LEXICON.md before the second use.

Starting points for inventions: soap film (fragile previews that pop), felt (absorbs, dampens: mute), velvet (pile direction shows which way it was last brushed: last sort order), mercury (splits and merges: split and combine), chalk (erasable, leaves ghosts: drafts with history), cork (holds pins: boards), amber (preserves forever: archive), salt (crystallizes from liquid: compile, finalize), smoke (shows air flow: activity), lacquer (layers build up: versions).

## Rendering techniques

| Effect | How |
|---|---|
| grain, fiber | `feTurbulence` as a data-URI background, blended with `multiply` or `soft-light` (runtime `--sl-grain`, `--sl-fiber`) |
| moving highlight | radial or linear gradient positioned with `--sl-lx` and `--sl-ly` |
| brushed metal | repeating 1px linear gradients plus a moving band highlight |
| frosted glass | `backdrop-filter: blur(var(--sl-frost))` animated with `@property` |
| wet sheen | `mix-blend-mode: lighten` layer that only brightens dark pixels (see `wet-ink-save.html`) |
| ragged edges | `feTurbulence` plus `feDisplacementMap` on an edge layer, never on text |
| char and burn | a radial gradient front, displaced (see `ember-delete.html`) |
| refraction | `backdrop-filter` with an SVG displacement filter where supported (Chromium), otherwise blur plus an offset highlight |
| liquid surfaces | SVG goo filter (`#sl-goo`) on blobs, or canvas for real fluid |
| caustics | a slowly animated turbulence layer at low opacity, paused when off screen |
| 3D depth | layered shadows, `perspective` transforms, or WebGL for real lighting |

Filters cost GPU time. Keep displacement and blur off large areas and off scrolling content. Test on a mid-range phone.
