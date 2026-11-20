// The content of the draw page: what it covers, the code to start from, the keys.

export const drawCovers: ReadonlyArray<string> = [
  "Rectangles, ellipses and diamonds with a solid or dither fill, a stroke and a label.",
  "Sticky notes in the token colours that grow with their text; text typed in place.",
  "Lines and arrows, straight or elbow, bound to items: they follow when the items move.",
  "A pixel pen: strokes land on a 4 px grid and are simplified.",
  "Frames: named, they move, clip and export their items.",
  "Images from a file or a drop, kept in the page, never uploaded.",
  "Group, lock, align, distribute, z-order; undo and redo through the canvas history.",
  "Export a frame or the selection as PNG or SVG; copy and paste the board as JSON.",
  "A minimal core (the canvas and the plugin host) and plugins for everything else: kinds, tools, rules, panels, exports. Add, remove or write them.",
];

export const drawSnippet = `import "@forgeron/canvas/styles.css";
import "@forgeron/draw/styles.css";
import { shapeItem, stickyItem } from "@forgeron/draw";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";

export function Board() {
  const store = useDrawStore();
  // A board is JSON: store.serialize() and store.load(json).
  return <DrawEditor store={store} label="Team board" />;
}`;

export const drawPluginsSnippet = `import { createDrawStore, definePlugin, exportSvg, parseBoard } from "@forgeron/draw";
import { fullCorePlugins } from "@forgeron/draw/plugins";
import { defineEditorPlugin, rectangle, sticky, toolbar } from "@forgeron/draw/plugins/editor";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";

// A board of rectangles and notes: the whole configuration is this list (module scope: a new list
// rebuilds the editor). A board that holds arrows or frames still opens: they are kept, drawn as
// labelled boxes, skipped by the exports, and written back as they were.
const plugins = [rectangle, sticky, toolbar];
const store = useDrawStore({ plugins });
<DrawEditor store={store} plugins={plugins} />; // or variant="sketch" | "minimal" | "full"

// Read-only places load the core halves only, never React: an export at build time, a Worker.
const cores = plugins.map((p) => p.core);
const { items } = parseBoard(json, cores, { unknown: "keep" });
exportSvg(items, { ids: items.map((i) => i.id) }, cores);

// Your own kind: two halves, the first with no framework in it (see the star of this page).
const starCore = definePlugin({ id: "star", name: "Star", description: "A star.", kinds: { star: starKind } });
const star = defineEditorPlugin({ core: starCore, tools: () => [starTool] });
createDrawStore({ plugins: [...fullCorePlugins, starCore] });`;

export const drawKeys: ReadonlyArray<{ label: string; combo: string }> = [
  { label: "Select", combo: "v" },
  { label: "Hand", combo: "h" },
  { label: "Rectangle", combo: "r" },
  { label: "Ellipse", combo: "o" },
  { label: "Diamond", combo: "d" },
  { label: "Sticky note", combo: "s" },
  { label: "Text", combo: "t" },
  { label: "Arrow", combo: "a" },
  { label: "Pixel pen", combo: "p" },
  { label: "Eraser", combo: "e" },
  { label: "Frame", combo: "f" },
  { label: "Group", combo: "mod+g" },
  { label: "Ungroup", combo: "mod+shift+g" },
  { label: "Lock", combo: "mod+shift+l" },
  { label: "Export PNG", combo: "mod+shift+e" },
  { label: "Duplicate", combo: "mod+d" },
];
