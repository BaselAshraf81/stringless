# Guess

The cold-read test. Stringless UI only works if people who have never seen it understand it. The designer always does, so the designer's opinion doesn't count. Guess shows the pixels to a reader with no context and scores what they predict.

## 1. Capture

With browser automation, capture each control in the target:

1. **Rest**: the whole surface, nothing hovered.
2. **Approach**: the pointer near each control in turn (40 to 80px away). Crop or annotate so the control is clear.
3. **Rehearse**: hover or focus on each control.

Turn captions off. Do not include any text that names the action. Number the controls on a copy of the rest screenshot (small numbered markers beside them, outside the controls), and save everything under `.stringless/guess/<target>/`.

## 2. Ask a cold reader

The reader must not see the code, the lexicon, the conversation or the labels.

- **Claude Code with the Stringless plugin**: delegate to the `stringless:cold-reader` subagent with only the image paths and the number of controls.
- **Other tools with subagents**: start a fresh subagent with only the images and the prompt below.
- **No subagents**: ask the user to show the images to someone who hasn't seen the work. As a last resort, run the prompt yourself in a fresh session and mark the result as weak evidence.

Prompt for the reader:

> You are seeing an interface for the first time. For each numbered control: (1) what will happen if you use it, (2) what it will affect, (3) how you would use it (tap, hold, drag), (4) your confidence from 1 to 5. Also list anything that looks clickable but probably isn't, and anything that looks decorative but might be a control. Base every answer only on what you see.

## 3. Score

For each control, against the spec:

| Score | Meaning |
|---|---|
| hit | verb and target both right |
| partial | one of verb or target right, or right with confidence 1 or 2 |
| miss | wrong, or not noticed as a control |

Targets by strangeness: levels 1 and 2 need hits at rest. Level 3 needs hits by the rehearse screenshots. Levels 4 and 5 may need one interaction, but must never be missed entirely.

## 4. Fix misses without words

Climb the signifier ladder instead of adding a label:

- Not noticed as a control: strengthen the form's grip and the approach response.
- Wrong verb: make the rehearsal show more of the effect, earlier.
- Wrong target: bind harder (move the control onto the target, add a tether or a lean).
- Two controls confused with each other: change their silhouettes, not only their motion.

Retest only the controls that changed.

## 5. Report

Write `.stringless/guess/<target>-<date>.md` with the reader's answers, the scores, the fixes, and the retest. Summarize in one line per control.
