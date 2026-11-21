// What an edge is made of besides its line, editor halves: the arrowhead at its input, the "+"
// halfway along it that asks the app to insert a step, and the handle at its end that drags it to
// another input (or off, to delete it). Each is an edge part the edge layer draws inside the edge.

import { defineEditorPlugin } from "../../react/plugin";
import { edgeArrows, edgeInsert, edgeReconnect } from "../ui";

export const edgeArrowsPlugin = defineEditorPlugin({
  core: edgeArrows,
  edgeParts: [
    {
      id: "arrowhead",
      order: 10,
      render: ({ arrow }) => <polygon className="fg-flow-edge-arrow" points={arrow} />,
    },
  ],
});

export const edgeInsertPlugin = defineEditorPlugin({
  core: edgeInsert,
  edgeParts: [
    {
      id: "insert-button",
      order: 20,
      // The button shows on hover and on the selected edge (flow.css): it is only rendered then.
      render: ({ edge, mid, hover, selected, readOnly, onInsert }) =>
        onInsert && !readOnly && (hover || selected) ? (
          <g
            className="fg-flow-edge-insert"
            transform={`translate(${mid.x} ${mid.y})`}
            role="button"
            aria-label="Insert a step on this edge"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onInsert(edge, mid)}
          >
            <rect x={-8} y={-8} width={16} height={16} vectorEffect="non-scaling-stroke" />
            <path d="M-4 0H4M0 -4V4" vectorEffect="non-scaling-stroke" />
          </g>
        ) : null,
    },
  ],
});

export const edgeReconnectPlugin = defineEditorPlugin({
  core: edgeReconnect,
  edgeParts: [
    {
      id: "reconnect-handle",
      order: 30,
      render: ({ ctx, edge, end, selected, readOnly, drag }) =>
        selected && !readOnly ? (
          <rect
            className="fg-flow-edge-end"
            x={end.x - 14}
            y={end.y - 4}
            width={8}
            height={8}
            vectorEffect="non-scaling-stroke"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              e.preventDefault();
              const { flow } = ctx;
              drag(e, (ev) => {
                const under =
                  typeof document.elementFromPoint === "function"
                    ? document.elementFromPoint(ev.clientX, ev.clientY)
                    : null;
                const handle = under?.closest<HTMLElement>("[data-canvas-handle]");
                const item = (handle ?? under)?.closest<HTMLElement>("[data-canvas-item]");
                const itemId = item?.dataset.canvasItem;
                if (!itemId) {
                  // Dropped on the surface: the edge goes.
                  flow.removeEdges([edge.id]);
                  return;
                }
                const r = flow.resolve(
                  { itemId: edge.from.node, handle: `out:${edge.from.port}` },
                  handle?.dataset.canvasHandle
                    ? { itemId, handle: handle.dataset.canvasHandle }
                    : { itemId },
                );
                if (r) flow.reconnect(edge.id, "to", r.to);
              });
            }}
          />
        ) : null,
    },
  ],
});
