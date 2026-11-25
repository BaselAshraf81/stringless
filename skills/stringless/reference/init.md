# Init

Learn the product well enough that every later command can design for it. Writes PRODUCT.md when it's missing and FEATURES.md always. Never invents a visual world; that belongs to `lexicon`.

## 1. Read before asking

- Look for PRODUCT.md, FEATURES.md, LEXICON.md and DESIGN.md in the project root and `docs/`.
- PRODUCT.md from another tool (Impeccable writes one) is authority. Read it, don't rewrite it. Add a `## Stringless` section to it only if the user agrees.
- Scan the code: routes, screens, components, the copy on controls, data models (the nouns), handlers and API calls (the verbs), confirm dialogs and toasts (the weights and echoes), and any accessibility setup.
- Run `node <skill-dir>/scripts/stringcheck.mjs --inventory <src>` for a count of labeled controls per file.

## 2. Ask only what the code can't say

One round of two or three questions, then wait. Use the structured question tool when there is one. Pick from:

- Who uses this, how often, and in what situation? (Daily expert use and one-time visitors need different strangeness.)
- Which actions are dangerous or hard to undo?
- How strange can it get? Offer the five levels in one line each and let the user pick a default.
- Any constraints: platforms, accessibility standards, brands, frameworks, performance budgets.

State what you inferred and let the user correct it, instead of asking about it.

## 3. Write PRODUCT.md (only if missing)

Use `<skill-dir>/assets/templates/PRODUCT.md`. Facts only: users, purpose, context, constraints, accessibility needs. No visual decisions. Mark unknowns as open.

## 4. Write FEATURES.md

Use `<skill-dir>/assets/templates/FEATURES.md`. One section per feature. For each:

- **Job.** What the user is trying to get done, in their words.
- **Objects.** The nouns it works on.
- **Verbs.** Each action with weight (light, medium, heavy), frequency, and whether and how it can be undone.
- **States.** The states the objects pass through (draft, saved, shared, archived, failed).
- **Surfaces.** Where it lives (route, screen, component path).
- **Strings today.** The visible chrome labels it uses now, from the inventory.
- **Strangeness.** The level for this feature, if it differs from the default.

FEATURES.md is the map every other command reads, so be complete and plain. Verbs and objects should use the same words across features.

## 5. Next

Recommend `lexicon` when there is no LEXICON.md. Otherwise recommend `map` for the surface with the most labeled controls, or `forge` for a named component.
