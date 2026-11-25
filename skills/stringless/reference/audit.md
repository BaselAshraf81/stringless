# Audit

Check stringless work against the floor. Report findings by priority; fix them when the user asked for fixes.

## 1. Automated

Run `node <skill-dir>/scripts/stringcheck.mjs <files or folders>`. It reports controls with no accessible name, controls that can't be focused, heavy-sounding verbs without heavy weight, removed outlines, hover rules with no focus twin, motion with no reduced-motion handling, idle infinite loops, words painted into controls, and generic labels.

## 2. By hand

Use the browser for each control:

| Check | Pass when |
|---|---|
| Name | Every control has a role and a name a screen reader reads; toggles expose state (`aria-pressed`, `aria-checked`, `aria-expanded`) |
| Keyboard | Tab reaches it in a logical order; focus shows approach and rehearsal; Enter or Space commits; heavy actions need two presses with an announcement in between; Escape cancels |
| Touch | Touch-hold shows the rehearsal; nothing needs hover; targets are at least 44 by 44px |
| Captions | `?` toggles captions; a long press shows one; hesitation shows one |
| Reduced motion | Every verb has a still version that keeps the meaning; no idle loops |
| Echo | Heavy actions leave a focusable remnant with an undo window that's announced |
| Rehearsal safety | Rehearsals change no data and make no network writes; leaving reverses them |
| Contrast | Text on any material is at least 4.5:1 (3:1 for large text); focus rings are at least 3:1 against what's around them |
| Performance | 60fps with 4x CPU throttling in DevTools; filters only on small areas; nothing animates off screen; no layout shift from proximity effects |
| Lexicon | Materials, verbs and phases match LEXICON.md; no material has two meanings |
| Content | No content, numbers, prices, legal text or error explanation was removed |
| Screen reader pass | A full pass with VoiceOver or NVDA makes sense in order, with no unnamed controls and no unexplained silence after actions |

## 3. Report

Rank each finding:

- **P0** blocks use: no name, no keyboard path, destructive action with no guard, content removed.
- **P1** blocks some users: hover-only meaning, no reduced-motion version, contrast failure, missing announcement.
- **P2** weakens it: jank, lexicon drift, weak rehearsal, missing echo on medium actions.
- **P3** polish: patina, sound, fluency tuning.

One line per finding: priority, control, file and line, what fails, the fix.
