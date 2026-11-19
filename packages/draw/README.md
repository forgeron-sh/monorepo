# @forgeron/draw

The whiteboard on [`@forgeron/canvas`](../canvas/README.md): shapes, sticky notes, text, lines and arrows bound to items, a pixel pen, frames and images, with PNG and SVG export. Board is built on it. Decision: D-148 in [`docs/DECISIONS.md`](../../docs/DECISIONS.md).

Internal package; the API is not frozen. The chrome (tool dock, style pickers, buttons) comes from `@forgeron/ui`; draw imports canvas and ui, never flow or Blueprint, and neither canvas nor ui imports draw.

## Layers

```text
 @forgeron/draw              core: no React, no DOM
   types · palette           the items' data, colours as token ids (they follow the theme)
   drawKinds                 hit test and resize rule of each kind, for the canvas engine
   createDrawEngine          a CanvasEngine around another: frames carry their items, bound arrows follow,
                             groups select together, copies point at copies; same undo step as the change
   arrows · pen · frames · text · arrange · create      pure functions
   parseBoard / serializeBoard                          the board's JSON, version 1
   paintItem · exportSvg     one drawing for the editor and the export

 @forgeron/draw/react        the editor
   <DrawEditor store>        canvas + tools + CanvasToolbar + Inspector + ZoomControls + Minimap
   useDrawStore · createTools · Inspector · exportSvgDocument · svgToPng · download
```

Import the styles once, after ui's and canvas's: `import "@forgeron/draw/styles.css"`.

## Example

```tsx
import { shapeItem, stickyItem } from "@forgeron/draw";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";

function Board() {
  const store = useDrawStore();
  // store.add(stickyItem({ x: 0, y: 0 }, "Hello")); store.serialize(); store.load(json)
  return <DrawEditor store={store} label="Team board" />;
}
```

## The model

An item is a canvas item whose `data.type` says what it is:

| Kind                              | `data`                                                                    | Hit test, resize                                  |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `rectangle`, `ellipse`, `diamond` | `shape`: `fill` (none, solid, dither pattern), `stroke`, `text?`          | its outline; eight handles                        |
| `sticky`                          | `sticky`: `color` (amber, green, rose, ember, grey), `text`               | its box; at least 80, grows with its text         |
| `text`                            | `text`: `text`, `size`, `color`, `align`                                  | its box; width only, height follows the text      |
| `arrow`                           | `arrow`: `start`, `end` (local point, `bind?`), `head`, `route`, `stroke` | near its route; no box, ends dragged by handles   |
| `pen`                             | `pen`: `points` (whole pen pixels, simplified), `cols`, `rows`, `color`   | near its line; keeps its ratio, pixels scale      |
| `frame`                           | `frame`: `name`                                                           | its name strip and edge; inside reaches the board |
| `image`                           | `image`: `src` (object or data URL, never uploaded), `name`               | its box; keeps its ratio                          |

Every kind but a frame may carry `group` (selected together) and `frame` (moves with it, clipped by it). Colours are token ids (`ink`, `accent`, `warning`…) or `#rrggbb`.

- **Arrows** land on the outline of the item they are bound to, facing the other end; elbows leave from the middle of a side. Moving, resizing or deleting an item puts its arrows back in the same undo step; an arrow dragged on its own lets go of the items that stayed. Dragging an end (`data-canvas-handle`) onto an item binds it there.
- **Frames** hold the items whose centre is inside them, settled when a change ends: an item joining a frame is raised above it, a frame that moves takes its items, deleting it keeps them.
- **The pixel pen** works on a grid of 4 world units (five pixels to a canvas cell): points go to pixels, Ramer–Douglas–Peucker drops what stays within a pixel of the line, Bresenham draws whole pixels between the vertices.
- **JSON** is the canvas document with `"format": "forgeron/draw"`: `{ format, version: 1, items, viewport? }`. `parseBoard` checks each item's data against its kind and fills what may be left out. An image's object URL lives as long as the page; a board saved for later needs data URLs.

## Tools and keys

V select · H hand · R rectangle · O ellipse · D diamond · S sticky note · T text · A arrow · P pixel pen · E eraser · F frame; image from the dock or a drop. A click places a shape of a default size, a drag sizes it (Shift: square, Alt: off the grid). Double-click writes in a note, a text or a shape; on the board, starts a text. ⌘G group, ⇧⌘G ungroup, ⇧⌘L lock, ⇧⌘E export PNG; the canvas keys too (⌘Z, ⌘D, ⌘C, ⌘V, arrows, ⌘] and ⌘[). ⌘C also puts the selection's JSON on the system clipboard; ⌘V pastes a board's JSON from it.

## Tests

`bunx vitest run packages/draw`: the core (each kind's hit test and resize, arrows following moves and gestures, frames, the pen, arranging, the JSON round trip, history) and the editor in jsdom (draw a rectangle, type text, a sticky that grows, connect an arrow and move its end, erase, the pen, tool keys).
