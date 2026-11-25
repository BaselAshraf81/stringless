# Map

Inventory every visible string on a surface and turn each one into an intent. The map is the plan for `stage`, `unstring` and `forge`. It writes nothing but the map.

## 1. Collect

- Run `node <skill-dir>/scripts/stringcheck.mjs --inventory <files of the surface>` for control labels, placeholders, titles and generic labels with file and line.
- Then read the surface yourself for what the scanner misses: text built in script, toasts, confirm dialogs, empty states, tooltips, helper text, status words, error messages, and icon-only controls whose meaning lives in a tooltip.
- If the app runs, look at it. Some strings only appear in certain states.

## 2. Classify each string

| Class | Example | What happens to it |
|---|---|---|
| chrome label | "Save", "Delete", "Share", a menu icon | becomes an intent to unstring |
| instruction | "Drag files here", "Click to edit" | replaced by an affordance or a rehearsal |
| status | "Saved", "Syncing...", "Draft" | becomes a phase; the word moves to the accessible name and an announcement |
| confirmation | "Are you sure?" | becomes weight (hold or press twice) plus an echo with undo |
| content | names, titles, prices, dates, user text, destinations | stays as text |
| explanation | error reasons, legal text, help articles | stays as text |
| data-entry label | "Email", "Card number" | stays, unless the field's form makes it unambiguous |

## 3. Write intents

For each chrome label, instruction, status and confirmation, write one row:

| String | Where | Verb | Object | Weight | Undo | Frequency | Lexicon entry |
|---|---|---|---|---|---|---|---|
| "Delete note" | NoteCard.tsx:42 | delete | note | heavy | 7s ash | weekly | ember corner (exists) |

Mark rows that share a verb and object: they become one component.

## 4. Save

Write `.stringless/maps/<surface>.md` with the table, the counts per class, and a short list of the components to forge, most valuable first (high frequency, high confusion, or high risk). Keep content and explanation strings in a separate list so no one removes them by mistake.

## 5. Next

Recommend `stage` for the surface when its layout will change, or `unstring` when the layout stays and only the controls change.
