// The content of the canvas page: what it covers, the code to start from and the API tables.

import { CANVAS_KEYMAP, type CanvasCommand } from "@forgeron/canvas";

interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ApiTable {
  title: string;
  rows: ReadonlyArray<ApiRow>;
}

export const covers: ReadonlyArray<string> = [
  "An infinite surface: wheel pans, ⌘ or Ctrl + wheel and pinch zoom, Space-drag or middle-drag pan.",
  "Select: click, Shift-click to toggle, drag a box, Alt-drag a lasso, ⌘A.",
  "Move, resize from eight handles, nudge with the arrows (Shift: 10). Snaps to the 20 px grid; Alt frees it.",
  "Undo and redo of patches: a whole drag, or a run of nudges, is one step.",
  "Duplicate, copy, cut and paste; JSON with a version field.",
  "Zoom presets, zoom to fit, a minimap, the zoom controls built from @forgeron/ui.",
  "Focusable surface, items in a listbox reached with Tab, selection announced, no glide under reduced motion.",
];

export const snippets: ReadonlyArray<{ title: string; lang: "tsx"; code: string }> = [
  {
    title: "A canvas with your items",
    lang: "tsx",
    code: `import "@forgeron/canvas/styles.css";
import { Canvas, Minimap, useCanvasStore, ZoomControls } from "@forgeron/canvas/react";

export function Board({ items }) {
  const store = useCanvasStore({ items, kinds: { card: { resize: { minW: 120 } } } });
  return (
    <Canvas store={store} label="Board" renderItem={(item) => <Card {...item.data} />}>
      <ZoomControls history />
      <Minimap />
    </Canvas>
  );
}`,
  },
  {
    title: "The headless core, without React",
    lang: "tsx",
    code: `import { createCanvasStore } from "@forgeron/canvas";

// Named commands over the engine interface: dispatch(command) and query(question), plain data.
const store = createCanvasStore({ items: saved.items, grid: { size: 20 } });
store.query({ type: "hit", point: { x: 120, y: 40 } });
store.select(["a", "b"]);
store.nudge(10, 0);          // one undo step for a run of nudges
store.duplicateSelection();
store.undo();
const json = store.serialize({ viewport: true }); // { "version": 1, "items": [...] }`,
  },
  {
    title: "A kind and a tool of your own",
    lang: "tsx",
    code: `const kinds = {
  ellipse: {
    hitTest: (item, p) => insideEllipse(item.bounds, p),
    resize: { keepAspect: true, minW: 20, minH: 20 },
  },
};

const rectangle = {
  id: "rect",
  label: "Rectangle",
  shortcut: "r",
  cursor: "crosshair",
  down(pointer, { store, snap }) {
    const start = snap(pointer.world, pointer);
    store.beginGesture("Draw");
    const [item] = store.add({ kind: "rect", bounds: { ...start, w: 1, h: 1 }, data: {} });
    return {
      move: (p) => store.resize(item.id, rectFromPoints(start, snap(p.world, p))),
      up: () => { store.endGesture(); store.setTool("select"); },
      cancel: () => store.cancelGesture(),
    };
  },
};

const store = useCanvasStore({ kinds });
<Canvas store={store} tools={[rectangle]} label="Whiteboard" renderItem={render} />`,
  },
];

export const tables: ReadonlyArray<ApiTable> = [
  {
    title: "<Canvas>",
    rows: [
      {
        name: "store",
        type: "CanvasStore<D>",
        description: "From useCanvasStore or createCanvasStore.",
      },
      {
        name: "renderItem",
        type: "(item, { selected }) => ReactNode",
        description: "Draws one item inside its positioned box.",
      },
      { name: "label", type: "string", description: "Names the surface for assistive technology." },
      {
        name: "primitive",
        type: "(item) => Primitive | null",
        description: "The shape the renderer draws under the overlay.",
      },
      {
        name: "renderer",
        type: "() => CanvasRenderer",
        default: "createDomRenderer",
        description: "Draws grid, shapes and selection from a Scene; stable.",
      },
      {
        name: "itemLabel",
        type: "(item) => string",
        default: "<kind> <id>",
        description: "Names an item for assistive technology.",
      },
      {
        name: "tools",
        type: "CanvasTool[]",
        description: "Consumer tools; select and pan are built in.",
      },
      {
        name: "layers",
        type: "{ below?, above? }",
        description: "World-space layers: edges, guides, previews.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Screen-space chrome: ZoomControls, Minimap, toolbars.",
      },
      {
        name: "keyboard",
        type: '"focus" | "page" | false',
        default: '"focus"',
        description: "Where the canvas keys listen.",
      },
      {
        name: "wheel",
        type: '"pan" | "zoom"',
        default: '"pan"',
        description: "What the plain wheel does.",
      },
      {
        name: "boxMode",
        type: '"intersect" | "contain"',
        default: '"intersect"',
        description: "What a box selects.",
      },
      {
        name: "nudge",
        type: "{ small, large }",
        default: "{ 1, 10 }",
        description: "World units of an arrow, and with Shift.",
      },
      {
        name: "onConnect",
        type: "(from, to, point) => void",
        description: "End of a drag started on a data-canvas-handle.",
      },
      {
        name: "canConnect",
        type: "(from, to) => boolean",
        description: "Whether a target is valid while connecting.",
      },
      {
        name: "onItemActivate",
        type: "(item) => void",
        description: "Double click or Enter on an item.",
      },
      {
        name: "onSurfaceDoubleClick",
        type: "(point) => void",
        description: "Double click on the empty surface.",
      },
      {
        name: "onContextMenu",
        type: "(item | null, point, event) => void",
        description: "Right click; the item is selected first.",
      },
    ],
  },
  {
    title: "createCanvasStore(options)",
    rows: [
      {
        name: "items",
        type: "Item<D>[]",
        description: "{ id, kind, bounds: { x, y, w, h }, z, locked?, data }.",
      },
      {
        name: "kinds",
        type: "KindMap<D>",
        description: "Per kind: hitTest, resize, movable, selectable, duplicate.",
      },
      {
        name: "grid",
        type: "{ size, snap, visible }",
        default: "{ 20, true, true }",
        description: "The pixel grid.",
      },
      {
        name: "zoom",
        type: "{ min, max, presets }",
        default: "0.1 – 4",
        description: "Limits and the stops of the buttons.",
      },
      { name: "viewport", type: "{ x, y, zoom }", description: "The first camera." },
      { name: "historyLimit", type: "number", default: "200", description: "Undo steps kept." },
      { name: "readOnly", type: "boolean", default: "false", description: "Select and pan only." },
      {
        name: "createId",
        type: "(kind, exists) => string",
        default: "<kind>-<n>",
        description: "Ids of new items; no randomness.",
      },
    ],
  },
  {
    title: "Store commands",
    rows: [
      {
        name: "add · update · updateMany · remove · apply",
        type: "→ one undo step each",
        description: "Change the document.",
      },
      {
        name: "beginGesture · endGesture · cancelGesture",
        type: "",
        description: "Group a drag into one undo step, or drop it.",
      },
      {
        name: "select · selectAll · clearSelection",
        type: "(ids, mode?)",
        description: "replace, add, toggle, remove.",
      },
      {
        name: "moveBy · nudge · resize",
        type: "",
        description: "Locked and unmovable items stay put.",
      },
      {
        name: "duplicateSelection · copy · cut · paste",
        type: "",
        description: "Copies one cell away; paste at a point.",
      },
      {
        name: "bringToFront · sendToBack · undo · redo",
        type: "",
        description: "Stacking and history.",
      },
      {
        name: "zoomIn · zoomOut · zoomTo · resetZoom · fitView · centerOnItem",
        type: "",
        description: "The camera, kept on whole pixels.",
      },
      {
        name: "setTool · setConnection",
        type: "",
        description: "The tool state and the connect gesture.",
      },
      { name: "serialize · loadJSON", type: "", description: "JSON with a version field." },
    ],
  },
  {
    title: "<ZoomControls> · <Minimap>",
    rows: [
      {
        name: "tools",
        type: "boolean",
        default: "true",
        description: "ZoomControls: the select and hand segments.",
      },
      {
        name: "history",
        type: "boolean",
        default: "false",
        description: "ZoomControls: undo and redo buttons.",
      },
      {
        name: "fitMaxZoom",
        type: "number",
        default: "1",
        description: "ZoomControls: fit never zooms past it.",
      },
      {
        name: "width · height",
        type: "number",
        default: "180 · 112",
        description: "Minimap: its size in CSS pixels.",
      },
      {
        name: "colorOf",
        type: "(item) => string",
        description: "Minimap: a colour or token per item.",
      },
    ],
  },
  {
    title: "Hooks",
    rows: [
      {
        name: "useCanvasStore(options)",
        type: "CanvasStore<D>",
        description: "Creates the store once.",
      },
      {
        name: "useCanvas()",
        type: "{ store, items, selection, viewport, tool, … }",
        description: "Inside <Canvas> or <CanvasProvider>.",
      },
      {
        name: "useCanvasState(store, select)",
        type: "T",
        description: "One slice, re-rendering only when it changes.",
      },
      {
        name: "useConnection()",
        type: "Connection | null",
        description: "The wire being drawn, for a preview.",
      },
    ],
  },
];

/** The keys, one row per command. */
export const keys: ReadonlyArray<{ combo: string; label: string; command: CanvasCommand }> =
  CANVAS_KEYMAP.filter((b, i, all) => all.findIndex((x) => x.command === b.command) === i);
