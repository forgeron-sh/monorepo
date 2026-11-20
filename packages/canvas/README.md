# @forgeron/canvas

The shared engine of the editors that work on an infinite surface: pan and zoom, world and screen coordinates, the pixel grid and snapping, hit testing, box and lasso selection, move, resize and nudge, undo and redo, JSON, the minimap, fitting the view and the canvas keys. It knows nothing of what an item is: `@forgeron/flow` (nodes and edges), `@forgeron/draw` (whiteboard) and the data hub's schema diagram define their kinds on top of it. Decision: D-148 in [`docs/DECISIONS.md`](../../docs/DECISIONS.md).

Internal package; the API is not frozen. The chrome around a canvas (toolbars, inspectors, menus) comes from `@forgeron/ui`; canvas imports ui, never the other way.

## Layers

```text
 @forgeron/canvas            core: no React, no DOM
   CanvasEngine              the interface: dispatch(command) · query(question) · getState · subscribe · serialize/load
   createTsEngine            its TypeScript implementation (reference)
   withCommands / createCanvasStore   named commands over any engine: store.undo(), store.fitView()…
   geometry · viewport · grid · hit · selection · history · serialize · keymap · tools   pure functions

 @forgeron/canvas/react      the view: talks to the engine interface only
   <Canvas>                  input (pointer, wheel, keys) → commands and queries
     CanvasRenderer          draws the primitives from a Scene (createDomRenderer: 2D canvas + SVG)
     DOM overlay             renderItem: text, fields, rich content, accessibility
   <ZoomControls> <Minimap> <CanvasShortcuts>   chrome, built from @forgeron/ui atoms
   useCanvasStore · useCanvas · useCanvasState · useConnection
```

Import the styles once, after those of ui: `import "@forgeron/canvas/styles.css"`.

## Example

```tsx
import { Canvas, Minimap, useCanvasStore, ZoomControls } from "@forgeron/canvas/react";

function Board({ items }) {
  const store = useCanvasStore({ items, kinds: { card: { resize: { minW: 120 } } } });
  return (
    <Canvas
      store={store}
      label="Board"
      primitive={() => ({ shape: "rect", fill: "--bg", stroke: "--line-strong" })}
      renderItem={(item) => <CardText {...item.data} />}
    >
      <ZoomControls history />
      <Minimap />
    </Canvas>
  );
}
```

## The model

- An **item** is `{ id, kind, bounds: { x, y, w, h }, z, locked?, data }`. `data` is the consumer's and passes through untouched.
- The **viewport** is `{ x, y, zoom }`: `screen = world × zoom + (x, y)`. The translation stays on whole pixels so the grid and 1 px lines stay crisp. Zoom from 0.02 to 4, presets 2 % to 400 %: the floor is low so that fit (`1`) shows a whole large board; the grid dots thin out as the zoom falls and hide under 5 % (`GRID_MIN_ZOOM`).
- The **grid** is 20 world units; moves and resizes snap to it, Alt frees them. Arrows nudge by 1, Shift by 10.
- **History** is patches (`add`, `remove`, `update` with what it replaced). A drag or a resize between `gesture: begin` and `end` is one step; consecutive nudges of one selection merge into one step.
- **JSON**: `{ "version": 1, "items": [...], "viewport"? }`. An unknown version, a malformed item or a duplicate id is refused (`CanvasFormatError`).
- Ids of new items are `<kind>-<n>`, counting up, or `createId`: nothing random.

## Interaction rules

From the prototypes `flows.html` and `board.html`:

| Input                                      | Does                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| Wheel, two-finger scroll                   | Pans (`wheel="zoom"` makes it zoom). Shift: sideways           |
| ⌘ or Ctrl + wheel, pinch                   | Zooms around the pointer                                       |
| Space + drag, middle button, hand tool (H) | Pans. Shift + drag with the hand still draws a box             |
| Click                                      | Selects one item; Shift or ⌘ toggles; the empty surface clears |
| Drag on the surface                        | Box: touched items (`boxMode="contain"`: inside). Shift adds   |
| Alt + drag on the surface                  | Lasso: items whose centre is inside                            |
| Drag an item                               | Moves the selection, snapped; from a locked item, draws a box  |
| Handles of a single selection              | Resize within the kind's rule; Shift keeps the ratio           |
| Drag from a `data-canvas-handle`           | Connect gesture (ports, arrows)                                |
| Escape during a gesture                    | Cancels it, nothing recorded                                   |

Keys (`CANVAS_KEYMAP`): arrows nudge (Shift: 10), Backspace/Delete, ⌘A, Escape, ⌘Z, ⇧⌘Z and ⌘Y, ⌘D, ⌘C, ⌘X, ⌘V, `=` and `-` zoom by preset, `0` to 100 %, `1` fit, `2` fit the selection, V select, H hand, ⌘] and ⌘[ stacking. By default they listen while the surface or an item has the focus (`keyboard="focus"`, works with several canvases on one page); `keyboard="page"` binds them on the page through ui's `useShortcuts`.

Accessibility: the surface is focusable (`role="application"`, named by `label`); items are options of a listbox with one tab stop; Tab and Shift+Tab walk them in reading order, Alt + arrows to the nearest in a direction, Enter activates, Escape clears. The selection is announced in a live region. Under reduced motion, the zoom buttons jump instead of gliding; the wheel and the keys never glide.

## Building on canvas

What flow, draw and the schema diagram plug in:

1. **Kinds.** `kinds: { [kind]: KindDefinition }` given to the engine: `hitTest(item, point)` (an ellipse, a line), `resize: false | { handles, minW, minH, maxW, maxH, keepAspect }` (a flow node: `handles: ["e", "w"]`), `movable`, `selectable`, `duplicate(item, id)` (reset run state, rename). The look is in the view: `primitive(item)` for a shape the renderer draws, `renderItem(item, { selected })` for the DOM overlay, `itemLabel(item)` for assistive technology.
2. **Layers.** `layers={{ below, above }}` are React nodes drawn in world units with the items: edges under the nodes, guides and drop previews above. `<WorldSvg>` is an SVG at the world origin that draws outside its box; give strokes `vectorEffect="non-scaling-stroke"` to keep them 1 px. Layers let clicks through; an element that wants them sets `pointer-events` and `data-canvas-interactive`. Screen-space chrome goes in `children`.
3. **Connect.** Any element inside an item with `data-canvas-handle="<name>"` starts the connect gesture on press. While it runs, `store.getState().connection` (or `useConnection()`) is `{ from: { itemId, handle }, point, over }`, `over` being the item or handle under the pointer (`data-canvas-handle` of the target) when `canConnect(from, to)` allows it. On release `onConnect(from, over | null, point)` is called: flow adds an edge or opens the palette there, draw adds an arrow. The edges themselves are the consumer's data, drawn in a layer.
4. **Tools.** The tool is state (`store.setTool(id)`). `select`, `pan` and `lasso` are built in (`gestureFor` decides what a press does). A consumer tool is `{ id, label, shortcut?, cursor?, down(pointer, { store, snap }) }`; `down` returns `{ move, up, cancel }` and usually wraps its changes in a gesture so the whole stroke is one undo step. Draw's rectangle, pen, text and sticky are tools; flow's "add block" can be one.
5. **Renderer.** `renderer={createMyRenderer}` replaces how primitives are drawn: `mount({ under, over })`, `render(scene)`, `unmount()`. A `Scene` is plain data (viewport, size, grid, visible primitives in world units, outlines, handles, box and lasso in screen pixels). Renderers draw only; input stays in `<Canvas>`.
6. **Far view.** `far={{ zoom, kinds, below?, keep?, overlay? }}`: below `zoom`, the items whose kind has a far drawing (`kinds[kind](item, { selected })` → `FarPrimitive[]`: `rect`, `ellipse`, `diamond`, `line`, `triangle`, `text`, world units, colours as tokens or CSS) leave the DOM and are drawn on one WebGL2 surface (a 2D canvas without it) under the overlay; a pan or a zoom only moves the camera there. `below` draws primitives that are not items (flow's edges); `keep` keeps items in the DOM (an item being typed). `renderItem` gets `state.far`; crossing the zoom, the DOM catches up a few items a frame. Hit testing stays the engine's. With `overlay`, the GPU draws the kinds at every zoom (boxes, ellipses and diamonds with solid or 4 × 4 dither fills and dashed strokes, crisp on device pixels when asked; lines with butt or square caps and dashes; anti-aliased triangles; `runs` of pixels; `image`s uploaded once loaded; filled `polygon`s through the stencil; `glyphs`, lines of text laid out by `wrapText` and drawn from an atlas of the DOM's own glyphs, in the order of the rest), with the selection's outlines, its handles, the box and the lasso; above `zoom` the DOM holds only the items `overlay(item)` says show something over that drawing, the focused one and `keep` (whose kind gets `kept: true` and leaves out what the DOM shows, a field being typed). Primitives may carry a zoom range (`minZoom`, `maxZoom`). Text layout is pure (`wrapText`, `placeLine`, `ellipsize` on `FarTextMetrics`); `textMetrics(el)` of `@forgeron/canvas/react` gives the browser's, shared by the surface and the editors.

## The engine interface, and the Rust engine to come

`CanvasEngine` is the only door to the document: `dispatch(command)` with a plain-object command (`{ type: "nudge", dx, dy }`), `query(question)` (`{ type: "hit", point }`, `in-rect`, `in-lasso`, `visible`, `handle-at`, `nearest`…), `getState`, `subscribe`, `serialize`, `load`. `<Canvas>`, the chrome and the store's named commands use nothing else; the pure functions of `core/` are the TypeScript engine's internals and helpers for tests and consumers.

The TypeScript engine (`createTsEngine`) keeps its items in an id table over a spatial index (`core/spatial-index.ts`: a hashed uniform grid of 256-unit cells, a list for the very large items, the stacking order sorted again only when z changes): `hit`, `in-rect`, `in-lasso`, `visible` and `nearest` ask the index instead of scanning every item, and patches are applied by id. At 20,000 items a hit test takes about a microsecond and moving 500 items a fifth of a millisecond (`docs/benchmarks/canvas-engine.md`). A kind's own `hitTest` is asked only for points inside the item's bounds: a shape that reaches outside them makes its bounds cover it.

D-148 plans to move the core to a Rust crate compiled to WebAssembly (`fg-canvas-core`) after a benchmark. How the interface maps onto it:

| Interface                | WASM engine                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `dispatch(command)`      | one exported function taking the command (JSON or a compact binary form), returning `EngineResult`                       |
| `query(question)`        | answered from the same hashed grid as the TypeScript engine; `visible` is culling, `hit` stays under 1 ms at 20k items   |
| `getState` / `subscribe` | a change counter read after each dispatch; items mirrored to JS lazily, by id, for the DOM overlay                       |
| `serialize` / `load`     | the same JSON, version 1                                                                                                 |
| `Scene` for the renderer | GPU vertex buffers in shared memory, drawn by a WebGL2 `CanvasRenderer`; the DOM overlay keeps text and accessibility    |
| `kinds`                  | data (`resize`, `movable`, `selectable`, a declared shape for hit testing); a JS `hitTest` stays possible as a slow path |

`src/core/engine-contract.ts` is the behaviour every engine must have, written against the interface only; `engine.test.ts` runs it on the TypeScript engine and the WASM binding runs the same suite.

## Tests

`bunx vitest run packages/canvas`: the engine contract, the pure core (geometry, viewport, grid, hit testing, resize, selection, serialisation, the press state machine, keyboard navigation), the store's commands and the React layer in jsdom (selection, drag, box, keys, focus and announcements, connect, consumer tools, a custom renderer, the zoom controls).
