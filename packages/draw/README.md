# @forgeron/draw

The whiteboard on [`@forgeron/canvas`](../canvas/README.md): shapes, sticky notes, text, lines and arrows bound to items, a pixel pen, frames and images, with PNG and SVG export. A minimal core and plugins: every feature is a plugin you add, remove or write. Board is built on it. Decisions: D-148 and D-154 in [`docs/DECISIONS.md`](../../docs/DECISIONS.md).

Internal package; the API is not frozen. The chrome (tool dock, style pickers, buttons) comes from `@forgeron/ui`; draw imports canvas and ui, never flow, richtext or Blueprint, and neither canvas nor ui imports draw.

## Layers

```text
 @forgeron/draw                    the minimal core: no React, no DOM
   plugin                          the plugin contract (core half), resolvePlugins, createRegistry
   createDrawEngine                a CanvasEngine around another: calls the rules of the plugins
                                   (carry, remove, settle, follow, select, copy) in the same undo step
   parseBoard / serializeBoard     the board's JSON, version 1, whatever the plugins
   exportSvg · paintItem           one drawing for the editor and the export, looked up by kind
   palette · geometry · text       what the kinds share
   + the helpers of each kind      arrows, pen, frames, arranging, constructors (shapeItem, stickyItem...)

 @forgeron/draw/plugins            the core halves of the bundled plugins and the presets (no editor)
   .../plugins/shapes · notes · lines · layout · media · export · ui       one subpath per family
   .../plugins/docs                every plugin as data (`PluginDoc[]`)
 @forgeron/draw/plugins/editor     their editor halves (tools, DOM views, panels, keys) and the presets
   .../plugins/editor/shapes · notes · lines · layout · media · export · ui

 @forgeron/draw/react              the editor
   <DrawEditor store plugins>      canvas + zoom controls + whatever the plugins draw (dock, panel, minimap)
   useDrawStore · Inspector · createEditorRegistry · exportSvgDocument · svgToPng · download
```

Import the styles once, after ui's and canvas's: `import "@forgeron/draw/styles.css"`.

## Example

```tsx
import { shapeItem, stickyItem } from "@forgeron/draw";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";

function Board() {
  const store = useDrawStore();
  // store.add(stickyItem({ x: 0, y: 0 }, "Hello")); store.serialize(); store.load(json)
  return <DrawEditor store={store} label="Team board" />; // the `full` preset
}
```

`variant` is sugar for a list of plugins: `full` (everything that ships), `sketch` (shapes, notes, pen and eraser, groups, lock, align, exports: no arrows, no frames, no images) and `minimal` (a rectangle, a text and the dock). The list is the whole configuration:

```tsx
import {
  alignPlugin,
  rectangle,
  sticky,
  text,
  toolbar,
  inspector,
} from "@forgeron/draw/plugins/editor";

const plugins = [rectangle, sticky, text, alignPlugin, toolbar, inspector]; // module scope: a new list rebuilds the editor
function Board() {
  const store = useDrawStore({ plugins }); // the same plugins give the store its kinds and rules
  return <DrawEditor store={store} plugins={plugins} />;
}

// Everywhere else the same list, as core halves, drives the JSON, the paint and the exports:
const cores = plugins.map((p) => p.core);
const { items } = parseBoard(json, cores, { unknown: "keep" });
exportSvg(items, { ids: items.map((i) => i.id) }, cores); // no React is loaded
```

Every function of the core (`parseBoard`, `exportSvg`, `exportedItems`, `paintItem`, `farPrimitives`, `createDrawStore`, `createDrawEngine`) takes the plugins as its last argument (an option for the store) and defaults to the `full` preset's core halves, so a call that names none reads and writes everything the bundled plugins know. `<DrawEditor inspector={false} minimap={false}>` leaves those two plugins out of any list.

## The minimal core

What the editor is with no plugin: the canvas items (select, move, resize, undo and redo, zoom, pan, the canvas keys), the draw engine's neutral part (it tracks the gesture and the undo step and calls the rules), the plugin host, and the board's JSON and clipboard format `forgeron/draw` version 1. It draws nothing and creates nothing; a board of items it does not know opens, moves and saves them untouched.

## Plugins

A plugin has two halves in two entry points, so a read-only place (the SVG export at build time, a board preview in a Worker) never loads React nor the canvas React layer.

**The core half** (`DrawPlugin`, framework-free: no React, canvas React layer or ui): `id`, `name`, `description`, `requires` (ids of plugins that must be in the list), and

| Field         | A plugin adds                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `kinds`       | item kinds (`KindSpec`): its `data.type`, the canvas hit test and resize rule, `parse` (JSON validation), `paint` (SVG), `far`, `words` |
| `engineRules` | hooks run inside the one undo step: `carry`, `remove`, `settle`, `follow` after a change, `select`, `copy` on those commands            |
| `json`        | `migrate`: old kinds it still reads, turned into current items                                                                          |
| `svg`         | what it adds to the SVG export: the items a frame brings (`scope`), `standalone`, clip paths (`layer`)                                  |
| `exports`     | ways out of the board (`ExportSpec`: id, name, mime, extension, `run`; to a file or the clipboard)                                      |

**The editor half** (`EditorPlugin`): `core`, and what it contributes to the **slots** of the editor:

| Slot       | A plugin adds                                                                 | Drawn by                          |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------- |
| `tools`    | tools (id, key, cursor, pointer handlers, dock icon): `(ctx) => ToolSpec[]`   | the dock (`toolbar`)              |
| `kinds`    | how a kind looks in the DOM: content, style, far view, text typed in place    | the editor                        |
| `panels`   | an inspector panel for a `data.type` (fill, stroke, colour, text...)          | `inspector`                       |
| `menu`     | buttons of the action rows (group, lock, align, export...), with `section`    | `inspector`                       |
| `toolbar`  | buttons of the dock that are not tools (the image picker)                     | `toolbar`                         |
| `keys`     | shortcuts, before the canvas sees them (`capture`) or after                   | the editor                        |
| `overlays` | layers above the items (the pen's preview, what the eraser will remove)       | the editor                        |
| `connect`  | dragging an item's end onto another item (an arrow's end)                     | the editor                        |
| `surface`  | a double click on the empty board; `drop`: files dropped on the editor        | the editor                        |
| `exports`  | exports that need a browser (the PNG), `prepareExport` (images inlined)       | the editor                        |
| `ui`       | components next to the canvas: the interface plugins draw the dock, the panel | `toolbar`, `inspector`, `minimap` |

Without the plugin that draws a slot (`toolbar`, `inspector`, `minimap`), that part of the interface is simply not there; the keys of the tools work without the dock. A duplicate id, a missing dependency, a cycle, two plugins that own a kind or an export are refused with a `PluginError`. The body of the editor is rebuilt when the list changes, because the interface plugins hold the editor they were given (`EditorContext`).

### What is a plugin

Shapes: `rectangle`, `ellipse`, `diamond` (R, O, D). Notes: `sticky`, `text` (S, T). Lines: `arrow` (A; binds to items, follows them, lets go when one is deleted, stays bound to copies), `pen` (P), `eraser` (E). Layout: `frame` (F; carries and clips its items, settles membership, exports with them), `groups` (⌘G, ⇧⌘G; selected together, copied as a new group), `lock` (⇧⌘L), `align` (align and distribute). Media: `image`. Export: `svg`, `png` (⇧⌘E), `json` (⌘C also puts the selection's JSON on the system clipboard, ⌘V reads it). Interface: `toolbar`, `inspector`, `minimap`, `arrange` (duplicate, delete, z-order). Each has a `PluginDoc` in `src/plugins/docs/*.ts` (summary, subpaths, requirements, options, a JSON sample of the board fragment, a usage snippet); `pluginDocs` lists them all.

### A plugin of your own

```ts
import { definePlugin, svgNode, type KindSpec } from "@forgeron/draw";
import { defineEditorPlugin } from "@forgeron/draw/plugins/editor";

const starKind: KindSpec = {
  type: "star",
  label: "Star",
  canvas: { hitTest: (i, p) => inCircle(i.bounds, p) },
  parse: (raw) => ({ type: "star", points: typeof raw.points === "number" ? raw.points : 5 }) as never,
  paint: (item, o) => [svgNode("polygon", { points: starPoints(item), fill: o.color("warning") })],
};
const starCore = definePlugin({
  id: "star",
  name: "Star",
  description: "A star.",
  kinds: { star: starKind },
  // engineRules: { follow, copy... } would run in the undo step of the change that triggers them.
});
const star = defineEditorPlugin({ core: starCore, tools: () => [starTool] }); // a tool with key `x`

createDrawStore({ plugins: [...fullCorePlugins, starCore] });
<DrawEditor store={store} plugins={[...fullEditorPlugins, star]} />;
```

The gallery's `/editors/draw` page has this star in `draw-star-plugin.ts`, with the plugins toggled one by one.

### Unknown kinds degrade, they never crash

An item whose kind no plugin of the editor knows is kept as is in the board JSON (`parseBoard(json, plugins, { unknown: "keep" })`; the store's `load` and `replace` never look at kinds), drawn as a labelled dashed box ("Unsupported item: arrow") that can still be selected and moved, named for assistive technology, skipped by the exports, and written back untouched. With the default `unknown: "throw"`, `parseBoard` refuses it with a `DrawFormatError`. A board written by the `full` preset opens in `sketch` with its arrows and frames kept; the engine rules of a missing plugin simply do not run.

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
- **JSON** is the canvas document with `"format": "forgeron/draw"`: `{ format, version: 1, items, viewport? }`. `parseBoard` checks each item's data against its kind and fills what may be left out. An image's object URL lives as long as the page; a board saved for later needs data URLs. The format is version 1 whatever the plugins: a board written by any list is read by the previous reader for the kinds that existed.

## Tools and keys

V select · H hand (the canvas's own) · R rectangle · O ellipse · D diamond · S sticky note · T text · A arrow · P pixel pen · E eraser · F frame; image from the dock or a drop. A click places a shape of a default size, a drag sizes it (Shift: square, Alt: off the grid). Double-click writes in a note, a text or a shape; on the board, starts a text. ⌘G group, ⇧⌘G ungroup, ⇧⌘L lock, ⇧⌘E export PNG; the canvas keys too (⌘Z, ⌘D, ⌘C, ⌘V, arrows, ⌘] and ⌘[). ⌘C also puts the selection's JSON on the system clipboard; ⌘V pastes a board's JSON from it.

## Boundaries

`.dependency-cruiser.cjs`: the core (`src/core/`, `src/index.ts`) and the core halves of the plugins (`src/plugins/*.ts`, `src/plugins/docs/`) import neither React, nor the `react/` layer, nor an editor half (`src/plugins/editor/`), nor canvas's React layer, nor ui, nor a Node module (`draw-core-is-framework-free`, `draw-core-stays-neutral`); draw imports neither flow, richtext nor Blueprint. `scripts/draw-boundary.test.ts` checks the half the tool cannot see (third-party packages) on the files a read-only place really loads, and that every bundled plugin has an editor half, a doc, and subpaths that exist in `package.json`.

## Tests

`bunx vitest run packages/draw scripts/draw-boundary.test.ts`: the core (each kind's hit test and resize, arrows following moves and gestures, frames, the pen, arranging, the JSON round trip, history); the golden board (`src/plugins/fixtures/golden.ts`: every kind, written before D-154: the JSON, the SVG exports, the page paint and the far view are byte for byte the same with the `full` preset); the plugin contract (the minimal core alone, resolution, unknown kinds, a star written in the test, rules inside one undo step, presets); and the editor in jsdom (draw a rectangle, type text, a sticky that grows, connect an arrow and move its end, erase, the pen, tool keys, the interface a list of plugins makes, a plugin of the app's own, unknown items).
