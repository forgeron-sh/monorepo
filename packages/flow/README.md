# @forgeron/flow

The node-graph editor on [`@forgeron/canvas`](../canvas/README.md): nodes with typed ports, edges, groups, a layered auto-layout and the run state of each node and edge. Used by Flows and the console automations, with the automation blocks of `@forgeron/ui` as its nodes and panels. Decision: D-148 in [`docs/DECISIONS.md`](../../docs/DECISIONS.md).

Internal package; the API is not frozen.

## Layers

```text
 @forgeron/flow              core: no React, no DOM (imports canvas's core only)
   model · graph             the document and its edits: connect, reconnect, insert on an edge, remove, copy, paste, groups
   checkConnection           why a connection is refused: missing-port, type, duplicate, occupied, fan-out, cycle…
   layoutGraph               the layered auto-layout, left to right
   planRun                   the frames of a run
   parseFlow · serializeFlow JSON, version 1
   items · controller        the graph on a canvas store: every edit is one undo step of the canvas history

 @forgeron/flow/react        the view
   useFlow                   the store, the controller, the graph now, the selected edges
   <FlowCanvas>              nodes (your body + ports), edges, group frames, the wire of a connection, zoom controls, minimap
   <FlowToolbar>             auto-layout and the edge style, from ui's atoms
```

Import the styles once, after those of ui and canvas: `import "@forgeron/flow/styles.css"`.

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

The live demo is `/editors/flow` in the UI gallery (`apps/ui-gallery/src/components/editors/FlowDemo.tsx`): StepPicker to add a block, StepInspector as the side panel, Run, the JSON.

## The model

- A **node** is `{ id, type, position, size, inputs, outputs, data }`; a **port** `{ id, label?, type?, multiple? }`. Inputs sit on the left side, outputs on the right, spread evenly (`portPoint`). `data` is yours and must survive JSON.
- An **edge** goes from an output to an input: `{ id, from: { node, port }, to: { node, port } }`.
- A **group** is `{ id, label, nodes }`, a frame drawn around its nodes; a node is in one group at most.
- **JSON**: `{ "version": 1, "nodes", "edges", "groups" }`. `parseFlow` refuses another version, a duplicate id, an edge to a port that does not exist, a node in two groups (`FlowFormatError`).
- **Rules** (`ConnectOptions`): types must match, or one side is `any` (or your `compatible(from, to)`); an input takes one edge unless `multiple`; an output fans out unless `multiple: false`; no duplicate edge, no edge to the same node; no cycle unless `cycles: "allow"`.
- **Run state**: `{ nodes, edges }` of `idle | running | success | error | skipped`. `planRun(graph, decide)` gives the frames, wave by wave: the outputs a node fires carry items (`running`), the others are `skipped`, and so is what only they reach.

## On the canvas

Each node is one canvas item of kind `flow-node`. Its data carries the node, **the edges that leave it** and its group, so an edge is a change of its source item and the canvas history undoes it with the rest: there is no second history. The graph is read back from the items (`itemsToGraph`); an edge whose target is gone is left out. The controller (`createFlowController`, or `useFlow`) computes each edit with the pure functions, then writes the difference to the store inside one gesture: deleting a node and the edges into it, a paste, a whole layout, each is one undo step.

- **Connect**: ports are `data-canvas-handle="out:<port>"` / `"in:<port>"`. Drag from a port: dropped on a port, that one; on a node, its first free input that accepts the edge; on nothing, `onConnectEnd(from, point)`. `canConnect` keeps the preview wire grey where the rules refuse. Dragging from an input works backwards.
- **Edges** are paths in a `<WorldSvg>` under the nodes, bezier or orthogonal (`edgePath`; a backward edge loops under its nodes), with arrowheads. A wide invisible stroke takes the click; hover or selection highlights it and shows its “+” (`onInsert`) and, selected, a handle at its end: drag it to another input to reconnect, off any node to delete. Running edges carry marching dashes, still under reduced motion.
- **Keys**: the canvas keys, except that Delete/Backspace, ⌘D, ⌘C, ⌘X and ⌘V are the flow's (edges go with their nodes, copies keep the edges between them; ⌘C writes flow JSON to the system clipboard, ⌘V reads it), and ⇧L lays out.
- **Groups** are frames in the layer under the edges, recomputed from their nodes; the label selects the group's nodes.
- **Level of detail**: below `farZoom` (40 %), nodes are plain labelled boxes instead of `renderNode`.

## Auto-layout

`layoutGraph(graph, options)` is a layered drawing in the manner of Sugiyama, written here: back edges of a depth-first search are turned around; layers by the longest path, a source moved next to its first successor; long edges through one virtual node per layer; barycentre sweeps with exact crossing counts, ports counted (a `true` output above `false`); vertical places by isotonic regression (pool adjacent violators) so each layer is as level with its neighbours as its order and gaps allow; snapped to the grid. Every step breaks ties in document order, so the same graph always gives the same drawing. `bun packages/flow/bench/layout.ts` times it: about 2.4 ms for 500 nodes and 700 edges, 11.5 ms for 2,000 and 2,800.

## Tests

`bunx vitest run packages/flow`: connection rules, geometry, layout (layers, branch order, grid, determinism, no overlap on 500 nodes, cycles), run frames, JSON and items round trips, the controller on a canvas store (undo of a delete, duplicate, paste, layout), and `<FlowCanvas>` in jsdom (render, connect by drag, a refused connection, delete and undo, edge selection and delete, duplicate, copy and paste).
