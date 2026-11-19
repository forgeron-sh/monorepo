// What a flow draws in world space around its nodes: group frames and edges under the nodes, the
// wire of a connection being made above them. Edges are paths in one <WorldSvg>; each takes clicks
// on a wide invisible stroke, shows an "insert" button halfway, and, selected, a handle at its end
// to drag it to another input (or off, to delete it). Only the edges whose box meets the canvas's
// cull window are drawn, and an edge's insert button only while it is hovered or selected.

import { intersects, screenToWorld, type Point } from "@forgeron/canvas";
import { useCanvasState, useConnection, useCullWindow, WorldSvg } from "@forgeron/canvas/react";
import { memo, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { FlowApi } from "./use-flow";
import { parseHandle } from "../core/controller";
import {
  edgeBounds,
  edgeGeometry,
  edgePath,
  groupBounds,
  portPoint,
  type EdgeStyle,
} from "../core/geometry";
import { isNodeItem, nodeOfItem } from "../core/items";
import { indexGraph, type FlowEdge, type FlowNode } from "../core/model";
import { edgeStatus, type RunState, type RunStatus } from "../core/run";

/** The surface an element sits on, and a client point in world units on it. */
function surfaceOf(el: Element) {
  return el.closest<HTMLElement>(".fg-canvas");
}
function worldAt<D>(flow: FlowApi<D>, el: Element, clientX: number, clientY: number): Point {
  const root = surfaceOf(el);
  const r = root?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return screenToWorld(flow.store.getState().viewport, { x: clientX - r.left, y: clientY - r.top });
}
function focusSurface(el: Element) {
  const root = surfaceOf(el);
  if (!root) return;
  root.dataset.pointer = "";
  root.focus({ preventScroll: true });
}

interface EdgeViewProps {
  edge: FlowEdge;
  d: string;
  arrow: string;
  mid: Point;
  end: Point;
  status: RunStatus;
  selected: boolean;
  label: string;
  readOnly: boolean;
  onPress: (edge: FlowEdge, e: ReactPointerEvent<SVGGElement>) => void;
  onInsert?: (edge: FlowEdge, point: Point) => void;
  onGrabEnd: (edge: FlowEdge, e: ReactPointerEvent<SVGRectElement>) => void;
}

const EdgeView = memo(function EdgeView({
  edge,
  d,
  arrow,
  mid,
  end,
  status,
  selected,
  label,
  readOnly,
  onPress,
  onInsert,
  onGrabEnd,
}: EdgeViewProps) {
  // The insert button shows on hover and on the selected edge (flow.css): it is only rendered then.
  const [hover, setHover] = useState(false);
  return (
    <g
      className="fg-flow-edge"
      data-edge={edge.id}
      data-status={status === "idle" ? undefined : status}
      data-selected={selected || undefined}
      data-canvas-interactive=""
      aria-label={label}
      onPointerDown={(e) => onPress(edge, e)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <path className="fg-flow-edge-hit" d={d} vectorEffect="non-scaling-stroke" />
      <path className="fg-flow-edge-line" d={d} vectorEffect="non-scaling-stroke" />
      {status === "running" ? (
        <path className="fg-flow-edge-flow" d={d} vectorEffect="non-scaling-stroke" />
      ) : null}
      <polygon className="fg-flow-edge-arrow" points={arrow} />
      {onInsert && !readOnly && (hover || selected) ? (
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
      ) : null}
      {selected && !readOnly ? (
        <rect
          className="fg-flow-edge-end"
          x={end.x - 14}
          y={end.y - 4}
          width={8}
          height={8}
          vectorEffect="non-scaling-stroke"
          onPointerDown={(e) => onGrabEnd(edge, e)}
        />
      ) : null}
    </g>
  );
});

export interface FlowEdgesProps<D> {
  flow: FlowApi<D>;
  style: EdgeStyle;
  run?: RunState | undefined;
  onInsert?: ((edge: FlowEdge, point: Point) => void) | undefined;
  edgeLabel?: ((edge: FlowEdge, from: FlowNode<D>, to: FlowNode<D>) => string) | undefined;
  /** The far view is on: the canvas's far layer draws the edges; only the selected stay here. */
  far?: boolean;
  /** At most this many edges in the DOM (back from far, they come back a few at a time). */
  limit?: number | null;
}

/** The edges of a flow, drawn under its nodes. */
export function FlowEdges<D>({
  flow,
  style,
  run,
  onInsert,
  edgeLabel,
  far = false,
  limit = null,
}: FlowEdgesProps<D>) {
  const graph = flow.current;
  const index = useMemo(() => indexGraph(graph), [graph]);
  // Each edge's path and box, computed when the graph changes, not when the camera moves.
  const shapes = useMemo(
    () =>
      graph.edges.flatMap((edge) => {
        const g = edgeGeometry(index, edge, style);
        return g ? [{ edge, g, box: edgeBounds(g) }] : [];
      }),
    [graph, index, style],
  );
  const cull = useCullWindow(flow.store);
  const [drag, setDrag] = useState<{ edge: FlowEdge; point: Point } | null>(null);
  const readOnly = flow.store.readOnly;
  const { selectEdges, store } = flow;

  const onPress = useMemo(
    () => (edge: FlowEdge, e: ReactPointerEvent<SVGGElement>) => {
      if (e.button !== 0) return;
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (!additive) store.clearSelection();
      selectEdges([edge.id], additive ? "toggle" : "replace");
      focusSurface(e.currentTarget);
    },
    [selectEdges, store],
  );

  const onGrabEnd = useMemo(
    () => (edge: FlowEdge, e: ReactPointerEvent<SVGRectElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture?.(e.pointerId);
      setDrag({ edge, point: worldAt(flow, el, e.clientX, e.clientY) });
      const move = (ev: PointerEvent) =>
        setDrag({ edge, point: worldAt(flow, el, ev.clientX, ev.clientY) });
      const up = (ev: PointerEvent) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", cancel);
        setDrag(null);
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
        const sourceHandle = `out:${edge.from.port}`;
        const r = flow.resolve(
          { itemId: edge.from.node, handle: sourceHandle },
          handle?.dataset.canvasHandle
            ? { itemId, handle: handle.dataset.canvasHandle }
            : { itemId },
        );
        if (r) flow.reconnect(edge.id, "to", r.to);
      };
      const cancel = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", cancel);
        setDrag(null);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", cancel);
    },
    [flow],
  );

  let budget = limit ?? Infinity;
  const preview = (() => {
    if (!drag) return null;
    const source = index.nodes.get(drag.edge.from.node);
    if (!source) return null;
    return edgePath(portPoint(source, "out", drag.edge.from.port), drag.point, style).d;
  })();

  return (
    <WorldSvg className="fg-flow-edges">
      {shapes.map(({ edge, g, box }) => {
        const kept =
          (!far && (!cull || intersects(cull, box)) && (limit === null || budget-- > 0)) ||
          flow.selectedEdges.has(edge.id) ||
          drag?.edge.id === edge.id;
        if (!kept) return null;
        const from = index.nodes.get(edge.from.node)!;
        const to = index.nodes.get(edge.to.node)!;
        return (
          <EdgeView
            key={edge.id}
            edge={edge}
            d={g.d}
            arrow={g.arrow}
            mid={g.mid}
            end={g.to}
            status={drag?.edge.id === edge.id ? "skipped" : edgeStatus(run, edge.id)}
            selected={flow.selectedEdges.has(edge.id)}
            label={edgeLabel?.(edge, from, to) ?? `Edge from ${from.id} to ${to.id}`}
            readOnly={readOnly}
            onPress={onPress}
            onInsert={onInsert}
            onGrabEnd={onGrabEnd}
          />
        );
      })}
      {preview ? (
        <path className="fg-flow-wire" d={preview} vectorEffect="non-scaling-stroke" />
      ) : null}
    </WorldSvg>
  );
}

/** The frames of the groups, under the edges; a label that selects the group's nodes. */
export function FlowGroups<D>({ flow }: { flow: FlowApi<D> }) {
  const graph = flow.current;
  const index = useMemo(() => indexGraph(graph), [graph]);
  if (graph.groups.length === 0) return null;
  return (
    <WorldSvg className="fg-flow-groups">
      {graph.groups.map((g) => {
        const b = groupBounds(index, g.nodes);
        if (!b) return null;
        return (
          <g key={g.id} className="fg-flow-group" data-group={g.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} vectorEffect="non-scaling-stroke" />
            <g
              className="fg-flow-group-label"
              data-canvas-interactive=""
              role="button"
              aria-label={`Select the group ${g.label}`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                flow.store.select(g.nodes, e.shiftKey ? "add" : "replace");
                flow.selectEdges([]);
                focusSurface(e.currentTarget);
              }}
            >
              <rect x={b.x} y={b.y} width={Math.max(60, g.label.length * 7 + 16)} height={20} />
              <text x={b.x + 8} y={b.y + 14}>
                {g.label}
              </text>
            </g>
          </g>
        );
      })}
    </WorldSvg>
  );
}

/** The wire of a connection being made, from its port to the pointer or the port under it. */
export function FlowConnectionWire<D>({ flow, style }: { flow: FlowApi<D>; style: EdgeStyle }) {
  const connection = useConnection();
  const items = useCanvasState(flow.store, (s) => s.items);
  void items;
  if (!connection) return null;
  const item = flow.store.get(connection.from.itemId);
  const h = parseHandle(connection.from.handle);
  if (!item || !isNodeItem<D>(item) || !h) return null;
  const a = portPoint(nodeOfItem(item), h.side, h.port);
  let b = connection.point;
  const over = connection.over;
  const target = over ? flow.store.get(over.itemId) : undefined;
  const oh = parseHandle(over?.handle);
  if (target && isNodeItem<D>(target) && oh) b = portPoint(nodeOfItem(target), oh.side, oh.port);
  const d = h.side === "out" ? edgePath(a, b, style).d : edgePath(b, a, style).d;
  return (
    <WorldSvg className="fg-flow-connecting" data-valid={over ? "" : undefined}>
      <path className="fg-flow-wire" d={d} vectorEffect="non-scaling-stroke" />
    </WorldSvg>
  );
}
