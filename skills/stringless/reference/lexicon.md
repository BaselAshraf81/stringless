# Lexicon

Build or extend LEXICON.md: the product's vocabulary of materials, verbs, weights, phases and directions. This is what makes stringless UI learnable. A user who learns that ash means "you can still undo" in one place can read it everywhere.

## 1. Gather

Read FEATURES.md (run `init` first if it's missing), PRODUCT.md, DESIGN.md and any existing LEXICON.md. List every object and every verb. Merge synonyms into one word (remove, delete, discard are one verb unless the product treats them differently).

## 2. Choose the world

One sentence that names the place the product's objects live, with its light and its era. Every material comes from this world, so the product feels like one place.

- Roll for it: `node <skill-dir>/scripts/roll.mjs --world`. Take a seed, or say in one line why you rejected each.
- A world fits the users and their work. A journaling app can live on a writer's desk at night; a finance tool can live in a bank vault with brass and stone; a photo app can live in a darkroom.
- DESIGN.md wins on palette and type. The world gives objects their materials and behavior within that palette.
- Present two or three worlds to the user in one line each when the choice is open, and let them pick.

## 3. Assign

- **Objects to materials.** Each object gets one material from the world, chosen by what that material does (see `channels/material.md`). Write why.
- **Verbs to choreography.** Each verb gets a control form, rehearsal, commit, echo and still version (see `channels/motion.md`). One verb, one choreography.
- **Weights.** Light, medium or heavy per verb, from consequence and reversibility, not from importance.
- **States to phases.** Each state gets a phase of matter or a visible change (see `channels/time.md`).
- **Directions.** Which way is forward, back, keep, discard, public, private.
- **Sound.** Whether sound exists at all, and the material voices if so.
- **Names.** The accessible name for every control. These feed captions and screen readers.

## 4. Check for collisions

- A material with two meanings: split one off to another material.
- A verb with two choreographies: pick one.
- Two verbs that look alike in the rest pose and do different things (send and share often collide): make their forms differ, not only their motion.
- A heavy action that looks light at rest: fix the rest pose.

## 5. Write LEXICON.md

Use `<skill-dir>/assets/templates/LEXICON.md`. Keep the `Tried` section: every metaphor that was considered, with kept or rejected and a short reason. The roll script reads it so new ideas don't repeat old ones.

## 6. Keep it alive

Every `forge`, `unstring` and `tune` that adds a material, verb or phase updates LEXICON.md in the same change. When code and lexicon disagree, fix one of them and say which.
