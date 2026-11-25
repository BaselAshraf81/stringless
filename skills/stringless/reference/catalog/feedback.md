# Catalog: feedback and state

Feedback is where interfaces use the most words: "Loading", "Saved", "Error", "Nothing here yet". Most of them can become a phase of matter or a change in the object itself. Error explanations, numbers and anything the user must act on keep their words.

## Loading
- **Condensing** [3]. Placeholders are vapor in the shape of the coming content; they condense into it as data arrives, and never pretend to be the real thing.
- **Rising dough** [4]. A long job rises like dough; the height is the real progress.
- **Breathing** [2]. An indeterminate wait as a slow, even swell of the container that will hold the result. Never a fake percentage.

## Progress
- **Filling** [2]. The vessel fills with what's being moved: pages for a document, frames for a video.
- **Print** [3]. The result slides out of a slot line by line as it renders.
- **Knitting** [4]. The output is knitted row by row; the needles show where the work is.

## Success
- **Settle** [1]. The object presses into place and stays a little heavier (runtime `settle`).
- **Crystallize** [2]. A single hard glint across the result (runtime `crystallize`).
- **Seal** [3]. A small seal pressed on the finished thing.

Avoid confetti for routine success. Celebrate only real milestones, and only in a world that celebrates.

## Errors
- **Crack** [2]. The failed object cracks along a line; the explanation sits beside the crack in plain words; the retry control is the crack itself, which closes when pressed.
- **Wound spring** [3]. A failed request tilts back like a spring held under tension; pressing releases it into a retry.
- **Refuse** [1]. Invalid input shakes "no" (runtime `refuse`), the bad part is marked, and the reason is shown as text.

## Empty states
- **Waiting vessel** [2]. The empty state is the container in its empty form, inviting the first thing: a mail slot with light coming through, a fresh pad, a basket, a bare shelf with dust outlines. The first action is part of the scene.
- **Seed** [4]. An empty project is a pot of soil with a seed ready to plant.

## Disabled
- **Missing ingredient** [2]. A disabled control points at what it needs: approaching it makes the empty required field glow, or traces a faint line to it. Use `aria-disabled` and keep it focusable so the reason can be found.
- **Under glass** [2]. The control sits under glass: visible, not touchable. The reason is in its caption.

## Notifications
- **Knock** [3]. The thing that needs attention shivers once, like a knock; with sound enabled, an actual knock. It never repeats.
- **Letters** [3]. New messages slide under the door one by one and pile up; the pile is the count.

## Sync and connection
- **Thread** [3]. A thread between the device and the cloud: taut when synced, beads traveling along it while syncing, slack and frayed when offline.
- **Tide** [4]. Offline is low tide: unsynced items sit on the wet sand until the tide comes back in.

## Presence and collaboration
- **Warm trails** [3]. Other people's cursors leave short warm trails; idle people dim like embers; who is editing a block shows as their color seeping into its edge.

## Warnings
- **Heat** [3]. A risky value heats the control: color temperature rises, then a shimmer at the very end.
- **Tension** [3]. A string that tightens as you near a limit, and sings with sound enabled.

## Rules

- Every state change is announced to screen readers with the state's name (`Stringless.announce`, or `aria-live` regions).
- A state that needs action shows how to act on it, in the place it appears.
- Don't loop status animations after the state resolves.
