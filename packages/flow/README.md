# @forgeron/flow

The node-graph editor on [`@forgeron/canvas`](../canvas/README.md): nodes with typed ports, edges, groups, a layered auto-layout and the run state of each node and edge. Used by Flows and the console automations, with the automation blocks of `@forgeron/ui` as its nodes and panels. Decision: D-148 in [`docs/DECISIONS.md`](../../docs/DECISIONS.md).

Internal package; the API is not frozen.

The editor is **a minimal core and plugins** (D-155): the core is the graph document, the controller over a canvas store and the plugin host; every feature (a kind of node, a type of port, a connection rule, an edge style, the layout, groups, run state, the clipboard, the keys, the toolbar) is a plugin of two halves. [Plugins](#plugins) below.

## Layers

```text
 @forgeron/flow              the minimal core: no React, no DOM (imports canvas's core only)
   model · edit              the document (nodes, edges, groups, ports as data) and its plain edits
   graph                     connect, reconnect, insert on an edge, asking the connection rules of the plugins
   parseFlow · serializeFlow JSON, version 1; a kind or a port type nobody knows is kept as it is
   items · controller        the graph on a canvas store: every edit is one undo step of the canvas history
   plugin                    the plugin contract (core half), `createRegistry`, `PluginError`
 @forgeron/flow/plugins      the core halves of the bundled plugins and the presets: no React either
 @forgeron/flow/react        the host: <FlowCanvas plugins>, <FlowToolbar>, useFlow, the editor contract
 @forgeron/flow/plugins/editor  the editor halves (drawing, keys, toolbar buttons) and the presets
 @forgeron/flow/plugins/docs    every bundled plugin documented as data (PluginDoc)
```

Import the styles once, after those of ui and canvas: `import "@forgeron/flow/styles.css"`.

A read-only place (a run plan on a server, a Worker validating a graph, a layout computed outside the browser) imports `@forgeron/flow` and `@forgeron/flow/plugins`, and loads neither React nor the canvas React layer nor ui: `scripts/flow-boundary.test.ts` walks what those entry points reach, and dependency-cruiser's `flow-core-is-framework-free` forbids the core halves to import `react/` and `plugins/editor/`.

## Example

```tsx
import { FlowCanvas, FlowToolbar, useFlow } from "@forgeron/flow/react";
import { StepCard } from "@forgeron/ui";

function Automation({ graph }) {
  const flow = useFlow({ graph });
  return (
    <FlowCanvas
      flow={flow}
      label="Automation editor"
      renderNode={(node, { selected, status }) => (
        <StepCard layout="node" {...node.data} selected={selected} status={status} />
      )}
      onConnectEnd={(from, point) => openPicker({ after: from, at: point })}
      onInsert={(edge) => openPicker({ on: edge })}
    >
      <FlowToolbar flow={flow} />
    </FlowCanvas>
  );
}
```

With no `plugins` the editor is the `full` preset: everything that ships, behaving as it always did. The live demo is `/editors/flow` in the UI gallery (`apps/ui-gallery/src/components/editors/FlowDemo.tsx`): StepPicker to add a block, StepInspector as the side panel, Run, the JSON, and a section that builds an editor from a plugin list.

## Plugins

A plugin has two halves in two entry points, so that a place with no browser never loads the second:

- **core half** (`FlowCorePlugin`, `@forgeron/flow/plugins`): `id`, `name`, `description`, `requires` (ids that must be in the list, ordered first), and what it means for the graph: `nodeKinds` (label, size, ports and data of a kind), `portTypes` (label, colour token, the types an input also takes), `connectionRules` (each `check(ctx)` returns `null` or the reason it refuses, with its sentence in `messages`), `edgeStyles` (a path function), `layouts` (an engine), `runPlanners`, `groups`, `clipboard` and `migrate` (old node types read as current ones). No React, no DOM.
- **editor half** (`FlowEditorPlugin`, `@forgeron/flow/plugins/editor`): `{ core, ... }` and the slots it fills.

```ts
const paidOnce = definePlugin({
  id: "paid-once",
  name: "Paid once",
  description: "An invoice has one payment.",
  requires: ["port-types"],
  nodeKinds: { invoice: { label: "Invoice", outputs: [{ id: "bill", type: "invoice" }] } },
  portTypes: { invoice: { label: "Invoice", color: "--accent" } },
  connectionRules: [
    {
      id: "paid-once",
      check: ({ source, target, graph }) =>
        source.type === "invoice" && target.type === "payment" && graph.edges.some((e) => e.from.node === source.id)
          ? "already-paid"
          : null,
      messages: { "already-paid": "An invoice is paid once." },
    },
  ],
});
const money = defineEditorPlugin({ core: paidOnce, nodeRenderers: { invoice: (n) => <Invoice node={n} /> } });
<FlowCanvas flow={flow} label="Billing" plugins={[...fullEditorPlugins, money]} />;
```

**Slots** of the editor half, read by the host:

| Slot                 | What it contributes                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodeRenderers`      | The body of a node of a kind; `"*"` draws every kind nobody else does (the `nodes` plugin: your `renderNode`)                                                    |
| `tools`, `shortcuts` | Commands by id, and the keys that run them (`mod+d`, `shift+l`); a tool answers `false` (not mine), `"native"` (done, let the browser's event follow) or nothing |
| `toolbar`            | Buttons (a tool) and choices (the edge style) drawn by the `toolbar` plugin                                                                                      |
| `layers`             | `below` and `above` the nodes in world space (edges, group frames, the wire), `overlay` over the surface (zoom controls, minimap)                                |
| `inspector`          | Panels about the selection, mounted only while something is selected                                                                                             |
| `edgeParts`          | What each edge is made of besides its line: arrowhead, insert button, reconnect handle                                                                           |
| `far`                | The GPU view: a node's box from far, every edge and group frame at every zoom (`FarEdge`, `FarGroupFrame`), hit-tested by the host                               |
| `handlers`           | The native copy, paste and pointer-down events of the root                                                                                                       |
| `ui`                 | The parts of the interface that draw the slots (`toolbar`)                                                                                                       |

**Presets** are plain lists. `fullEditorPlugins` is everything that ships; `minimalEditorPlugins` is nodes, edges (curves) and delete (no types, no layout, no clipboard, no toolbar); `typedEditorPlugins` is minimal plus arrowheads and the connection rules. `<FlowCanvas preset="minimal">` is sugar for the list; `plugins` wins. The same lists as core halves are `fullCorePlugins`, `minimalCorePlugins`, `typedCorePlugins`. Give `useFlow({ plugins })` the list too (its controller asks the rules), or let `<FlowCanvas>` set it. Keep a list in module scope: a new list rebuilds the editor body.

**Bundled plugins**: `nodes`, `edges`, `bezier`, `orthogonal`, `edge-arrows`, `edge-insert`, `edge-reconnect`, the six rules (`self-loop`, `port-types`, `no-duplicates`, `fan-out`, `single-input`, `no-cycles`), `layered`, `groups`, `run`, `clipboard`, `delete`, `far`, `toolbar`, `zoom-controls`, `minimap`. Each is documented as data (`PluginDoc`: id, family, name, summary, core and editor subpaths, requires, options, notes, a usage snippet and a JSON sample) in `@forgeron/flow/plugins/docs`.

**Errors**: a duplicate id, a missing dependency, a cycle, two plugins owning one kind of node, port type, edge style, layout, run planner, group or clipboard, two plugins drawing one kind, a shortcut naming a tool nobody brings: `PluginError`.

**Graceful degradation**: the document never depends on the plugins. A node whose kind no plugin draws is kept, drawn as a labelled dashed box with its ports, and written back untouched; an edge or port of a type nobody declares is kept; groups and a layout the plugins do not know stay in the JSON. Without the layout, clipboard or groups plugin, their methods of the controller do nothing (`autoLayout` returns an empty result), and without the connection rules any output connects to any input.

## The model

- A **node** is `{ id, type, position, size, inputs, outputs, data }`; a **port** `{ id, label?, type?, multiple? }`. Inputs sit on the left side, outputs on the right, spread evenly (`portPoint`). `data` is yours and must survive JSON.
- An **edge** goes from an output to an input: `{ id, from: { node, port }, to: { node, port } }`.
- A **group** is `{ id, label, nodes }`, a frame drawn around its nodes; a node is in one group at most.
- **JSON**: `{ "version": 1, "nodes", "edges", "groups" }`. `parseFlow` refuses another version, a duplicate id, an edge to a port that does not exist, a node in two groups (`FlowFormatError`).
- **Rules** (the connection plugins; `ConnectOptions` tunes them): types must match, or one side is `any` (or your `compatible(from, to)`); an input takes one edge unless `multiple`; an output fans out unless `multiple: false`; no duplicate edge, no edge to the same node; no cycle unless `cycles: "allow"`.
- **Run state**: `{ nodes, edges }` of `idle | running | success | error | handled | skipped`. `planRun(graph, decide)` gives the frames, wave by wave: the outputs a node fires carry items (`running`), the others are `skipped`, and so is what only they reach. A node that failed stops there (`{ status: "error" }`), unless its failure goes on through an error port to a retry (`{ status: "error", ports: ["error"] }`): it is then `handled`, drawn in the failure's colour with a mark in its corner (StepCard: "Failed · handled"), never green, while the retry that got through is `success`.

## On the canvas

Each node is one canvas item of kind `flow-node`. Its data carries the node, **the edges that leave it** and its group, so an edge is a change of its source item and the canvas history undoes it with the rest: there is no second history. The graph is read back from the items (`itemsToGraph`); an edge whose target is gone is left out. The controller (`createFlowController`, or `useFlow`) computes each edit with the pure functions, then writes the difference to the store inside one gesture: deleting a node and the edges into it, a paste, a whole layout, each is one undo step.

- **Connect**: ports are `data-canvas-handle="out:<port>"` / `"in:<port>"`. Drag from a port: dropped on a port, that one; on a node, its first free input that accepts the edge; on nothing, `onConnectEnd(from, point)`. The preview wire stays grey where a rule refuses, and says why next to the pointer (the rule's sentence). Dragging from an input works backwards.
- **Edges** are bezier or orthogonal (`edgePath`; a backward edge loops under its nodes), with arrowheads. With the `far` plugin (the `full` preset) they are drawn on the canvas's GPU layer at every zoom, one canvas group per edge (only an edge whose path or look changes is packed again): the line (1.5 units, 2 hovered or selected), skipped ones dashed, running ones with marching dashes (still under reduced motion), curves flattened finely enough for 200 % and joined end to end. The pointer finds an edge by its shape (`edgeAt`, 6 screen pixels of reach, the same as the old invisible stroke) at every zoom: a press selects it instead of starting a box, hovering highlights it and the DOM then holds its parts, the “+” (`onInsert`) and, selected, a handle at its end: drag it to another input to reconnect, off any node to delete (the GPU draws it grey and dashed while it is dragged). Only the edges in the canvas's cull window (the same window as its items) are in the GPU's buffer, plus those hovered, selected or dragged; the pointer finds any edge. An edge whose two nodes moved by the same whole number of units (a selection dragged) keeps its shapes, moved by its group's offset (`FarEdge.dx`, `dy`): its path is not computed again, and an edge whose nodes did not change is the same object. The DOM layer computes the paths of the edges it shows only. They are listed for assistive technology in the canvas's offscreen list ("Edge from A to B" with `nodeLabel`, described as `edge`, selected with the edge selection; the last selected edge is the active descendant while no node is). Without the `far` plugin edges are paths in a `<WorldSvg>`, as before.
- **Keys** (the `delete`, `clipboard` and `layered` plugins): the canvas keys, except that Delete/Backspace, ⌘D, ⌘C, ⌘X and ⌘V are the flow's (edges go with their nodes, copies keep the edges between them; ⌘C writes flow JSON to the system clipboard, ⌘V reads it), and ⇧L lays out.
- **Groups** are frames under the edges, recomputed from their nodes (on the GPU with the `far` plugin, else SVG); a press on the label selects the group's nodes (on the GPU, the host hit-tests the label's box, and each label is still a real button, offscreen, named "Select the group …": Enter or Space selects the nodes too).
- **Level of detail**: above `farZoom` (40 %) the nodes in view are their `renderNode` card (DOM) with their ports, the selection chrome drawn over them (`chromeOverDom`); below it they are labelled boxes on the GPU, with their ports, the handled mark, dashed when skipped, names laid out as glyphs with the canvas's text metrics and cut with an ellipsis. Nothing is drawn under a card that is mounted (`shown`), so a translucent card (a skipped step) shows what is under it, as before. The nodes are listed for assistive technology by the canvas's offscreen list (`nodeLabel`, their kind as role), the surface's active descendant following the selection. A card is not rendered again when its node only moves (`renderNode` is called again when the node's data, size, ports, selection or run state change, not its position); the graph read after a drag keeps its edges, groups, index and the nodes that did not move (`itemsToGraphAfter`, `indexGraph` kept per graph).

## Auto-layout

`layoutGraph(graph, options)` is a layered drawing in the manner of Sugiyama, written here: back edges of a depth-first search are turned around; layers by the longest path, a source moved next to its first successor; long edges through one virtual node per layer; barycentre sweeps with exact crossing counts, ports counted (a `true` output above `false`); vertical places by isotonic regression (pool adjacent violators) so each layer is as level with its neighbours as its order and gaps allow; snapped to the grid. Groups are laid out as blocks: each group's nodes by themselves first, then each group is one box (its drawing plus its frame's margin and label, `groupPadding` and `groupLabel`) in the drawing of the whole graph, so two frames never overlap and no node sits inside a frame it is not in. Every step breaks ties in document order, so the same graph always gives the same drawing. `bun packages/flow/bench/layout.ts` times it: about 2.5 ms for 500 nodes and 700 edges (2.6 ms with 12 groups), 12.6 ms for 2,000 and 2,800.

## Tests

`bunx vitest run packages/flow scripts/flow-boundary.test.ts`: connection rules, geometry, layout (layers, branch order, grid, determinism, no overlap on 500 nodes, cycles, group frames apart on random grouped graphs), run frames (a handled failure), JSON and items round trips, the controller on a canvas store (undo of a delete, duplicate, paste, layout), `<FlowCanvas>` in jsdom (render, edges on the GPU found by hover and by a press within reach, connect by drag, a refused connection, delete and undo, edge selection and delete, duplicate, copy and paste, the edges in the offscreen list with the selected one active, group labels as buttons), the graph read again after a drag, the GPU view (edge groups by run state, marching dashes, joins, the cache that keeps unchanged edges and moves an edge whose nodes moved together, hit testing of edges and group labels, ports and skipped borders, the flattening), the plugin host (resolution, ownership, the minimal core alone, unknown kinds and port types, a third-party kind with its own rule, the presets, JSON compatibility, layout and run goldens) and the docs.
