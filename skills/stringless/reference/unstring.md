# Unstring

Convert an existing labeled UI to stringless without changing what it does. Same handlers, same routes, same data, same permissions. Only presentation and interaction change.

## 1. Map

Use the surface's map, or run `map` now. Settle the strangeness level for the surface with LEXICON.md and PRODUCT.md.

## 2. Plan the ladder

Unstring in steps, and stop at the level the surface calls for:

| Step | Change | Level |
|---|---|---|
| Bind | Move each control onto or beside its target; add `data-sl-target` so the target answers the approach | 1 |
| Rehearse | Add the verb's rehearsal on the target | 1 |
| Weigh | Replace "Are you sure?" dialogs with hold or press-twice, plus an echo with undo | 1 |
| Phase | Replace status words with phases; keep the words in names and announcements | 2 |
| Matter | Give objects and controls their lexicon materials | 2 |
| Reform | Replace the control's shape with the lexicon's form (a corner, a tool, a vessel) | 3 |
| Restage | Rearrange the surface as a scene (run `stage` first) | 4 |

## 3. Move the words, don't delete them

- The visible label becomes the accessible name (`aria-label`) and the caption. Keep the same wording, so documentation and support scripts still match.
- Toggle states move to `aria-pressed`, `aria-checked` or `aria-expanded`.
- Status words move to `Stringless.announce` or an `aria-live` region.
- Content, explanations and data-entry labels stay visible (see the map's classes).
- Translations: the strings still go through the project's i18n system; they're just not painted.

## 4. Keep behavior identical

- The click handler, form submission, route and API call stay the same. Wrap; don't rewrite.
- A confirm dialog that guarded a destructive call becomes the heavy gesture. The keyboard and screen-reader path gets press-twice with an announcement, so nobody loses the guard.
- If the action had no undo and you add an echo, implement the undo for real (delay the call, or call the reverse) or don't promise one.
- Tests that find buttons by visible text: switch them to accessible names (`getByRole('button', { name: 'Delete note' })`), which still work.

## 5. Verify

- Before and after screenshots at rest and on approach for each converted control.
- Run `guess` on the after screenshots. A miss means climbing the signifier ladder (bind harder, rehearse clearer), never adding the word back on screen.
- Run `stringcheck` and the project's tests.

## 6. Record

Update LEXICON.md for every material, verb and phase used. In the report, list each converted control with old label, new form, gesture and weight, and the guess result.
