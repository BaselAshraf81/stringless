# Time

Time answers "where is it in time?" Interfaces usually show state with a word ("Saved", "Draft", "Syncing"). Stringless shows state as a phase of matter or as aging, so the object itself carries its history.

## Phases of matter

| Phase | Usual state | How it looks |
|---|---|---|
| wet | unsaved, just changed, not committed | sheen that follows the light, slightly darker, a little bleed |
| dry | saved, committed | matte, settled |
| frozen | paused, read-only, locked for a while | frost, desaturation, a cold tint, still |
| thawing | resuming | drips, the frost clears from one edge |
| liquid | in progress, flowing, changing | slow churn, movement inside |
| vapor | pending, temporary, may vanish | blur, drift, partial transparency |
| crystal | done, verified, final | sharp edges, one glint (runtime `crystallize`) |
| cracked | error, broken, needs attention | fracture lines, a red undertone at the cracks |
| ash | deleted but recoverable | gray, speckled, cooling embers |
| seed / sprout / bloom | queued, running, done (long jobs) | growth stages |
| glowing / dimming | active / idle | brightness |

The runtime handles `data-sl-phase` values `wet`, `dry`, `frozen`, `liquid`, `vapor`, `crystal`, `cracked` and `ash`. Change them with `Stringless.phase(el, value)`, which also fires `sl:phase`. Phases need their meaning in LEXICON.md, and their screen-reader text belongs in the accessible name or a live announcement.

## Echo windows

The echo is the time a heavy action stays undoable. Show the time running out as matter changing, not as a progress bar:

- ash cools (runtime `remnant`, `--sl-life` from 1 to 0)
- ink dries
- footprints fade
- a ripple calms
- an hourglass empties

Hovering or focusing a remnant pauses it. The remnant must be focusable and named ("Restore note"), and the action must be announced with its window ("Note burned. Press the ash within 7 seconds to restore it.").

## Rewind

Undo is time going backwards. Play the change in reverse, faster than it played forwards (1.3 to 1.5 times), and leave a short trace that a rewind happened: a faint motion blur, or the old state's ghost fading out.

Redo plays forwards again. A history scrubber can be a timeline you drag; when it moves, the content changes live.

## Waiting

Progress that shows what is happening, not just how much:

- a vessel filling with what's being transferred
- a print sliding out line by line as a document renders
- dough rising for a long job, with the rise matching real progress
- an uncertain wait (no known length) as a gentle loop that never pretends to be a percentage

Rules: a determinate wait shows the real fraction. An indeterminate wait never fakes one. Show nothing for waits under 300ms; show the stage, not just the fraction, for waits over 3 seconds.

## Fluency and hesitation

The runtime remembers per verb, in localStorage:

- **Uses** lower `--sl-intensity` toward 0.4, so rehearsals become quieter for verbs the user knows.
- **Hesitation** (a rehearsal held without commit for 1.6 seconds) shows the caption, sets `data-sl-hesitant`, raises intensity back to 1 and counts against fluency.

Design both ends: the first-time version must be clear, and the fluent version must not be dull.

## Patina

Wear shows what gets used. Give a control `data-sl-id` and the runtime counts commits and sets `--sl-wear` from 0 to 1 on a log scale. Use it for:

- polish on frequently pressed metal and stone
- softened edges and yellowing on paper and cloth
- a worn path between a list and the action used most

Patina is memory, not damage. Keep it subtle (at most 10 percent brightness or contrast change) and never let it reduce legibility.

## Avoid

- Status words ("Saved", "Syncing", "Draft") as the only state signal. Keep them in the accessible name and in captions.
- Phases that loop forever with no meaning.
- Undo that only exists as a toast in a corner far from the action.
