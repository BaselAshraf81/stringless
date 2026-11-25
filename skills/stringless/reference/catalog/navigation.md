# Catalog: navigation

Destination names are content: they keep their words. Stringless navigation removes the chrome around them (menu icons, "Back", "Next", "Close") and makes movement through the product feel like moving through a place.

## Tabs
- **Folders** [1]. Tabs are folder tabs with the folder behind them; hover lifts the folder so its first lines peek out.
- **Lens turret** [3]. Views are lenses on a turret; switching rotates the next lens into place and the content refocuses.
- **Rooms** [4]. Sections are rooms along a corridor; each doorway spills a little of what's inside (light, color, the top item).

## Back
- **Underlayer** [2]. The previous page sits under the current one. Hovering the left edge curls the current page back to show it; releasing turns back to it.
- **Thread** [3]. A thread runs back along the path you took; pulling it reels you back one step at a time.

## Menus
- **Fold** [3]. The menu is a folded sheet at the edge. Hover lifts its corner and shows the first lines printed inside; pressing unfolds it; leaving folds it back.
- **Pegboard** [2]. Tools hang on a board; picking one leaves its painted outline, so you can see what is out and put it back.
- **Constellation** [4]. Items are stars; the ones nearest the pointer brighten and name themselves.

## Breadcrumbs
- **Stacked sheets** [2]. The path is a stack of sheets, each level a little smaller; hover lifts a sheet to show that level.
- **Nesting** [3]. Levels are nested boxes; going up opens the box you're in to show the one around it.

## Pagination
- **Book edge** [2]. The thickness of pages on each side shows where you are; scrubbing the edge flips through.
- **Film strip** [3]. Pages are frames; the strip slides, and the current frame is lit.

## Dialogs
- **Grown from the trigger** [2]. A dialog unfolds out of the control that opened it and folds back into it on close (View Transitions).
- **Weight** [3]. The dialog's material says how serious it is: vapor for a light question, paper for a form, stone for a decision that can't be undone.

## Drawers and sheets
- **Curtain** [3]. A side panel is a cloth curtain; its edge sways a little on approach; pulling draws it.
- **Lid** [2]. A bottom sheet is a lid that lifts on a hinge, so you can see what it covers.

## Settings
- **Back panel** [4]. Settings live on the back of the app. Flipping it shows a panel of switches, dials and valves laid out like the product's parts.
- **Workbench** [3]. Each setting is a physical control near the thing it changes.

## Scroll and position
- **Spine** [2]. A long page shows its length as a book spine at the edge, with notches at sections.
- **Depth** [3]. Older content sinks back as you scroll down, so position reads as depth.

## Next and previous
- **Peek** [2]. The next item's edge sticks out from behind the current one; hovering pulls it out a little more.

## Rules

- Navigation must work with the keyboard alone, in a logical order, with a visible focus that follows the shape.
- Use real links (`<a href>`) for navigation so middle-click, new tabs and screen readers keep working.
- Shared elements keep their identity across views (View Transitions), so the user sees where they went.
- Back always goes back. Make the direction of travel consistent with LEXICON.md.
