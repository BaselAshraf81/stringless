# Stringless slop

Read this before writing UI code. Label-free design has its own failure modes, and some are older than the web. Each one below is a default, not a choice: the brief or LEXICON.md can earn one back, your habit can't.

## Failure modes

- **Mystery meat.** Unlabeled icons or images whose meaning only shows in a tooltip. This is what label-free design turns into when the meaning lives in hover text. Stringless meaning must be readable at rest or on approach, and must never need hover.
- **The skin.** A rounded rectangle with a paper or wood texture that behaves like every other button. A material that never folds, burns, dries, cracks or rings is a costume.
- **Icon swap.** Replacing the word with an icon. Icons are rung 4 of the ladder and need UI conventions; they're a fallback in the caption layer, not the design.
- **Words smuggled back.** "SAVE" printed on the blotter, "DELETE" stamped into the wax, text baked into an image. A painted word is still a word.
- **Skeuomorphic costume.** Stitched leather, felt and brass for atmosphere, with no behavior attached. Stringless borrows physics and meaning from materials, not decoration.
- **Motion soup.** Everything wiggles, idles, bounces or breathes. Motion at rest only for states that need the user, and it settles when they resolve.
- **One spring for everything.** The same easing on paper, stone and glass. Each material has its own mass and damping.
- **Puzzle UI.** The user has to experiment to find basic actions. At levels 1 to 3, a cold read must find every control.
- **Metaphor soup.** A paper desk with a spaceship lever and a glass bubble. One world per product, from LEXICON.md.
- **One metaphor for everything.** Every action is paper. A world has many materials; use them to tell verbs apart.
- **Hidden danger.** Destructive actions hidden behind gestures with no echo and no undo.
- **Silent to everyone.** "It's visual" as a reason for no accessible name.
- **Removing content.** Prices, names, dates, error explanations and legal text are information. They keep their words.
- **Red means delete.** Color alone isn't a signifier and fails for colorblind users. Material, form and motion carry the meaning; color supports it.
- **Fake rehearsal.** A hover effect that doesn't preview the actual effect (a generic glow, a lift, a scale). Rehearsal shows the start of this verb on this target.
- **Glass by default.** Glassmorphism and frosted cards as decoration. Glass is a material with a meaning (privacy, fragility, visibility); use it for that or not at all.
- **Soft UI.** Neumorphic extruded shapes. They fail contrast and hide the edge between control and surface.

## First-thought metaphors

These are the ideas everyone reaches for first. They're allowed only if the roll can't beat them for this product, and then the execution must be specific to the product. A paper plane made from the actual message, folding along its real text, is a design; a paper-plane icon is not.

| Verb | First thoughts |
|---|---|
| send | paper plane, rocket, arrow |
| delete | trash can with a moving lid, crumpled paper, a red X |
| save | floppy disk, cloud with a check |
| AI generate | sparkles, wand, glowing gradient border, a robot |
| like | heart burst, thumbs up |
| publish, launch | rocket |
| success | confetti, a check that draws itself |
| loading | spinning ring, skeleton shimmer |
| ideas, tips | light bulb |
| settings | gear |
| lock | padlock icon |
| search | magnifying glass icon |
| theme toggle | sun and moon that swap, day-to-night sky |

Before you build one of these, say in one line why the rolled alternatives lost.

## Visual defaults that still apply

Stringless work sits on top of a visual design. The general AI tells still count: one font for everything, purple-to-blue gradients, cards nested in cards, gray text on colored backgrounds, an icon tile above every heading, a big number with a small label as the hero. When a design skill such as Impeccable is installed, its rules govern the visual layer.
