# Tune

Deepen one channel of an existing stringless component. Read the channel's file first. Each channel has levels; find the component's level and take it up one or two, not five.

## material
1. A texture and color that match the lexicon.
2. A light response: the highlight follows the pointer (`--sl-lx`, `--sl-ly`), touch point or device tilt (`Stringless.light.tilt()`, see [touch](touch.md)).
3. Physics: commit motion uses the material's spring.
4. Phases: the material changes state (wet to dry, clear to frosted).
5. Sound and haptics, opt-in.
6. Patina: wear from use shows (`data-sl-id`, `--sl-wear`).

## motion
1. A commit animation that shows the verb.
2. A rehearsal on the real target, reversed on leave.
3. The commit continues from the rehearsal instead of restarting.
4. Interruptible: commit can be reversed mid-flight where the action allows.
5. Fluency: amplitude follows `--sl-intensity`.
6. A still version as clear as the moving one.

## form
1. A silhouette that differs from a plain rectangle in a way that means something.
2. Surface-native: the control is a part of its target.
3. State shows in the silhouette (open, closed, full, empty).
4. Morph: the control becomes the action or the result.
5. Grip shows the gesture (knurling to turn, a lip to pull).

## space
1. The target reacts on approach (`data-sl-target`).
2. The control leans toward the target, or a tether shows on rehearse.
3. Reach matches risk.
4. Spatial continuity: things travel to where they go.

## time
1. Status as a phase.
2. An echo with an undo window, shown as matter changing.
3. Rewind for undo.
4. Fluency and hesitation tuned for the verb.
5. Patina.

## sense
1. An opt-in control for sound and haptics, saved.
2. Commit sounds per material.
3. Arm, cancel and refuse sounds.
4. Haptic weights.

## Rules

- Change one channel per run, so the effect of the change is clear.
- Re-verify the component's states afterwards, including keyboard and reduced motion.
- Update LEXICON.md when the change adds or changes a meaning.
