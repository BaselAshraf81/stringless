# Catalog: inputs

Inputs hold data, so they follow the floor strictly: the value stays readable as text when exactness matters, the native element (or the right ARIA role) stays underneath, and keyboard behavior matches the platform. Data-entry fields keep a visible label unless the field's form makes its content unambiguous (a card-shaped card number field, an address line on an envelope for an email).

## Toggles (role="switch")
- **Frost pane** [3]. Privacy as frosted glass. A glass pane rests at the content's edge; hover slides it part way and frosts what it covers, which is how others will see it; pressing slides it shut. Your pointer wipes a clear patch that frosts over again, because you can still see it. See `examples/frost-privacy.html`.
- **Valve** [3]. A data flow on or off (sync, notifications, streaming). A valve wheel on a pipe; open shows the flow moving through a glass section of the pipe.
- **Lamp chain** [3]. Availability or attention. Pull the chain, the bulb glows; others see the light.
- **Seesaw** [2]. Two states as two weights on a beam; the heavy side is the current state; hover leans it a few degrees toward the other.
- **Candle** [3]. Presence: lit means available; blowing it out sets away; it relights itself after the chosen time.

## Single choice (role="radiogroup")
- **Marble** [3]. One marble, several cups. The marble sits in the chosen cup. Hovering another cup tilts the rail so the marble starts to roll; choosing rolls it over and drops it in. Only one marble exists, so only one choice can be made. See `examples/marble-choice.html`.
- **Spotlight** [2]. One light falls on the chosen option and slides to the next.
- **Key** [3]. Options are keyholes; the key turns in the chosen one.
- **Detent dial** [2]. A rotary selector with a click at each option; the options around it are content.

## Multiple choice
- **Pressed keys** [2]. Options are keys that stay down when chosen, like an old cash register.
- **Pins on a board** [3]. Choosing pins a card to the board; the board shows the set at a glance.
- **Beads** [4]. Chosen items are threaded on a string; the string's length is the count, and the clasp closes when the minimum is met.

## Sliders and ranges
- **Vessel** [2]. A value as liquid level. Dragging pours; the level is the value; near the limits the liquid strains at the rim.
- **Ruler and lens** [2]. For precise values: the thumb is a magnifier over a ruler; the closer you look, the finer the ticks.
- **Spring** [3]. For values with risk at the ends (budget, quality versus speed): the spring tightens, thins and heats as it nears the limit.
- **Weather** [4]. The range changes the scene it controls (temperature turns the scene warm or cold; volume lets sound waves out of a box).

## Steppers and quantities
- **Stack** [2]. Quantity is a stack of tokens (chips, plates, books). Plus adds one with a clack, minus lifts one off, dragging up or down adds or removes several.
- **Abacus** [3]. Beads slide along wires; tens on the next wire.

## Text
- **Wet ink** [2]. Typed text is wet until committed. Valid input dries; invalid input bleeds red under the bad part only.
- **Strength as material** [3]. Password strength as the field's surface: paper, then wood, then stone, then metal, changing as you type, with a crack where a weakness is.
- **Frosted secret** [3]. Password characters sit behind frost; holding the field breathes on it and clears it for a moment.
- **Vessel field** [2]. A character limit as a container: text fills it like liquid, and over the limit it spills past the rim, with the extra text marked.
- **Address line** [3]. An email field drawn as the address line on an envelope; the shape says what goes there.

## Search
- **Lens** [2]. The field is a magnifier moved over the content; matching items enlarge, others stay small.
- **Magnet** [3]. Typing turns the field into a magnet that pulls matching items toward it, strongest matches closest.

## Dates and times
- **Tear-off pad** [2]. A day calendar; flipping pages moves days; tearing one off picks it.
- **Sun path** [4]. Time of day as the sun's position over a horizon; dragging the sun sets the hour, and its shadow length is visible on the content.

## Files
- **Mouth** [3]. The drop zone widens as a file approaches and shows the file's real form (a page for documents, the image itself for photos) before you let go.

## Color
- **Palette knife** [3]. Mix pigments by dragging them together; the mix is the value, and the hex stays readable beside it.

## Consent
- **Signature** [3]. Agreement is a signature, not a checkbox: holding the line writes your initials in ink. It stays as the record and can be struck through to withdraw. The terms stay as text.

## Rating
- **Bloom** [4]. A bud opens wider with a higher rating; one petal per step, so the number can be counted.
- **Fill** [2]. A glass filled to the rating level, with marks at each step.

## Select (listbox, combobox)
- **Fan** [2]. Options fan out like a hand of cards from the closed select; the chosen card stays on top.
- **Rolodex** [3]. A wheel of cards for long lists; spinning shows the letter dividers.

## Rules for inputs

- The current value is always visible without interaction.
- Validation speaks through the field's material (bleed, crack, refuse) and keeps the explanation as text next to it.
- Arrow keys, Home, End, Page Up and Page Down work the way the native control does.
- Use `aria-valuetext` when the visual value is not a number ("half full").
