# Stage

Wireframe a surface as a stage: a place with objects, tools, light and forces, before any styling. A normal wireframe arranges boxes and labels. A stage decides where each thing physically is, what it's bound to, what can reach what, and which way things fall.

## 1. Inputs

The surface's map (run `map` first if there is none), LEXICON.md, PRODUCT.md and DESIGN.md. Settle the strangeness level for the surface.

## 2. Decide the scene

Answer each in one line:

- **Viewpoint.** Top-down (a desk, a table, a board), front-on (a shelf, a wall, a window), side-on (a cross-section, layers, water), or inside (a room).
- **Light.** Where it comes from. Shadows and highlights follow it everywhere on the surface.
- **Gravity.** Which way things fall: toward keep and archive, away from temporary things.
- **Depth.** What's in front (now), what's behind (past, background, archived).
- **Reach.** What sits within easy reach, what sits deliberately farther (dangerous or rare actions).
- **Frame.** Where global actions live (the window edge, the desk edge, the sky).

## 3. Place things

- **Objects.** The content, as the physical things the lexicon makes them.
- **Tools and parts.** Each control from the map, placed on or next to what it acts on. Prefer parts of objects (corners, edges, seams) over separate tools.
- **Bindings.** A line from each tool to its target. Long lines mean the tool is in the wrong place.
- **Flows.** Where things go when acted on: sent items leave by an edge, archived items sink, deleted items leave ash in place.

## 4. Draw it

ASCII, one sketch per breakpoint that changes the layout (usually desktop and phone). Show the light source, the reach zones and the flows. Example:

```
 light: desk lamp, top left          viewpoint: top-down desk
+----------------------------------------------------------------+
| [note stack]               [open note: paper]          (blotter)|
|  each card: char corner     wet paragraphs ~~~      binds ->note|
|                                                                 |
|  .............. drawer lip (archive), out of easy reach .......|
+----------------------------------------------------------------+
 flows: deleted -> ash in place   archived -> drawer   saved -> dries
```

Under the sketch, one line per object and tool: material, binding, gesture, weight.

## 5. Check

- Every intent from the map has a place.
- No tool is far from its target unless it's global.
- Dangerous things are out of the easy path.
- The phone layout keeps frequent tools under the thumb and keeps bindings visible without hover.
- The scene is one world: no materials from outside the lexicon.

## 6. Save and confirm

Write `.stringless/stages/<surface>.md` with the scene answers, sketches and object list. Show it to the user and get a yes or one round of changes before forging. Then build the stage's components with `forge`, one intent at a time, most valuable first.
