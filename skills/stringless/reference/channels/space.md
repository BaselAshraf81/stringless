# Space

Space answers "what does it touch?" A control that sits away from its target with a word on it is a riddle. A control whose target reacts when you near it explains itself.

## Binding

Every control is bound to something: an object, a group, the page, the app. Show the binding in one of these ways, strongest first:

1. **Inside.** The control is a part of the target (its corner, edge or handle).
2. **Touching.** The control sits on the target's edge or overlaps it.
3. **Reaction.** The target answers when the control is approached (runtime `data-sl-target`; the target gets `data-sl-preview`).
4. **Tether.** A visible line from control to target while rehearsing (runtime `data-sl-tether="line"`).
5. **Lean.** The control tilts or shifts toward its target as the pointer approaches (`data-sl-lean`; uses `--sl-tdx` and `--sl-tdy`).
6. **Shared material.** The control is made of the target's material.

Global actions, the ones that act on everything on screen, bind to the frame of the screen itself: the window edge, the desk, the sky.

## Proximity

The runtime sets `--sl-near` from 0 (at the radius, default 120px) to 1 (on the control), plus `--sl-dx` and `--sl-dy` from -1 to 1 for the pointer's side.

- **Wake, don't flash.** The response grows smoothly with distance. Nothing pops at a threshold.
- **Make the near response small.** A shift of 1 to 3px, a light change, a glow on the target. Enough to say "I'm about this."
- **Point at the cause.** Use `--sl-dx` and `--sl-dy` for highlights and leans, so the control looks at the user.
- **Touch has no approach.** Touch-hold gives the rehearsal instead; the runtime does this. Keyboard focus gives approach and rehearsal at once.
- **Control density.** When controls sit close together, reduce `data-sl-radius` so several don't wake at once.

## Reach

Where a control sits says how often and how carefully it's used.

- Things you do often sit within reach: near the content, near the thumb on mobile, near the last thing touched.
- Dangerous things sit a little out of reach, behind a fold, at the far edge, or under a cover. Distance is a safety device.
- Things that act on one item live on that item. Things that act on many live in the shared space around them.

## Gravity and depth

- **Depth is importance and time.** The front layer is what's happening now. Behind it are past and background things: archives sink back, restores come forward.
- **Gravity is persistence.** Things that settle to the bottom are kept or saved. Things that float are temporary, pending or not yet committed.
- **Lift is attention.** A lifted item (bigger shadow, slight scale) is the one being acted on. Only one thing is lifted at a time.

## Continuity

- Objects keep their identity across screens. A card that opens into a detail view grows from where it was (View Transitions).
- Navigation is travel. Going deeper moves in, going back moves out. Siblings sit side by side.
- The way back is the way you came, in reverse.

## Avoid

- Controls in a toolbar far from what they affect, with no binding shown.
- Proximity effects that move layout. Use transforms and filters only, so nothing reflows under the pointer.
- Every control on screen reacting to the pointer at once.
