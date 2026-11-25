# Catalog: AI features

AI interfaces have the newest clichés: sparkles on every button, a wand, a glowing gradient border, "Generate" with a star. They say "magic", which tells the user nothing about what will happen. Stringless AI shows the one thing AI output always is until a person takes it: uncertain and not yet theirs.

## Core lexicon for AI

| Thing | Phase or material | Why |
|---|---|---|
| generated text not yet accepted | vapor | provisional, may vanish |
| accepted text | ink | committed, the user's own |
| suggested edits | graphite over ink | can be erased or inked in |
| low confidence | thinner, mistier, less settled | uncertainty is visible where it is |
| the model working | breath, condensation, a lamp moving through the document | presence, not a spinner |

Record whatever you choose in LEXICON.md and keep it consistent across every AI feature in the product.

## Generate
- **Condensing** [3]. Generated text arrives as vapor that drifts and blurs. Accepting condenses it into ink, word by word; rejecting blows it away. Low-confidence words stay mistier until accepted. See `examples/vapor-suggest.html`.
- **Weaving** [4]. Text is woven from threads pulled from the sources it used; the threads stay visible when you hover.
- **Seed** [4]. A prompt is a seed; generation grows it; you prune the branches you don't want.

## Rewrite and edit
- **Graphite overlay** [3]. Suggestions are written in graphite over the original. Inking one accepts it; rubbing it out rejects it. The original stays visible underneath until inked.
- **Tracing paper** [3]. The rewrite arrives on a translucent sheet over the original; slide it aside to compare; press it down to apply.

## Summarize
- **Distill** [3]. The text boils down; the summary is what remains at the bottom of the vessel. The original stays one gesture away.
- **Press** [3]. A press squeezes the document into a thin sheet; the thinner sheet is the summary.

## Translate
- **Reverse side** [3]. The card has two faces; flipping it shows the other language, with the original on the back.

## Explain
- **Lens** [2]. A lens over the selected text shows the explanation in the margin, attached by a thin line.

## Inline suggestions
- **Vapor ghost** [2]. Ghost text as vapor after the caret; Tab condenses it into ink; typing over it blows it away.

## Confidence
- **Ink density** [3]. Confident text is dense ink; uncertain text is lighter, like graphite; a citation is a pin into the source.
- **Focus** [3]. Uncertain claims are slightly out of focus and sharpen on hover to show their sources.

## Agents at work
- **Lamp** [4]. An agent working through files is a lamp moving through them; the files it reads are lit, the ones it changes are wet.
- **Hands** [4]. Ghost hands at the parts being changed; they lift away when it's done.

## Stop and regenerate
- **Pinch** [3]. Stopping pinches the stream of vapor off at the source.
- **Reshake** [3]. Regenerate shakes the vapor loose and it condenses again into a different shape.

## Rules

- Generated content is never in the committed phase until a person accepts it.
- Accept and reject both work from the keyboard (Tab, Escape) and say what they did.
- Uncertainty is shown where it is, not as a disclaimer at the bottom.
- No sparkles, wands or glowing gradient borders unless LEXICON.md gives them a specific meaning.
