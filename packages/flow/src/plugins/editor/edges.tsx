// The edges, editor half: the layer under the nodes that draws every edge as a path, the wire of a
// connection being made above them, and the toolbar choice of the edge style. What an edge is made
// of besides its line (arrowhead, insert button, reconnect handle) comes from the plugins that
// contribute edge parts (`./edge-parts.tsx`).
//
// Edges are paths in one <WorldSvg>; each takes clicks on a wide invisible stroke. Only the edges
// whose box meets the canvas's cull window are drawn, and an edge's parts only while they apply.

import { intersects, type Point } from "@forgeron/canvas";
import { useCanvasState, useConnection, useCullWindow, WorldSvg } from "@forgeron/canvas/react";
import {
  Fragment,
  memo,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { parseHandle } from "../../core/controller";
import { edgeBounds, edgeGeometryWith, portPoint } from "../../core/geometry";
import { isNodeItem, nodeOfItem } from "../../core/items";
import { indexGraph, type FlowEdge } from "../../core/model";
import { edgeStatus, type RunStatus } from "../../core/run";
import { edges as edgesCore } from "../ui";
import {
  defineEditorPlugin,
  type EdgePart,
  type FlowEditorContext,
  type LayerProps,
} from "../../react/plugin";
import { focusSurface, pathOf, worldAt } from "./surface";

interface EdgeViewProps<D> {
  ctx: FlowEditorContext<D>;
  parts: ReadonlyArray<EdgePart<D>>;
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
  onInsert: ((edge: FlowEdge, point: Point) => void) | undefined;
  beginDrag: (
    edge: FlowEdge,
    e: ReactPointerEvent<Element>,
    onDrop: (ev: PointerEvent) => void,
  ) => void;
}

function EdgeViewInner<D>({
  ctx,
  parts,
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
  beginDrag,
}: EdgeViewProps<D>) {
  // The parts that show on hover (the insert button) read it here: they are only rendered then.
  const [hover, setHover] = useState(false);
  const drag = useCallback(
    (e: ReactPointerEvent<Element>, onDrop: (ev: PointerEvent) => void) =>
      beginDrag(edge, e, onDrop),
    [beginDrag, edge],
  );
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
      {parts.map((part) => (
        <Fragment key={part.id}>
          {part.render({
            ctx,
            edge,
            d,
            arrow,
            mid,
            end,
            status,
            selected,
            hover,
            readOnly,
            onInsert,
            drag,
          })}
        </Fragment>
      ))}
    </g>
  );
}
const EdgeView = memo(EdgeViewInner) as typeof EdgeViewInner;

/** The edges of a flow, drawn under its nodes. */
export function FlowEdges<D>({ ctx, view }: LayerProps<D>) {
  const { flow, core, registry } = ctx;
  const { run, far, edgeLimit: limit, onInsert, edgeLabel } = view;
  const graph = flow.current;
  const index = useMemo(() => indexGraph(graph), [graph]);
  const path = pathOf(core, view.edgeStyle);
  // Each edge's path and box, computed when the graph changes, not when the camera moves.
  const shapes = useMemo(
    () =>
      graph.edges.flatMap((edge) => {
        const g = edgeGeometryWith(index, edge, path);
        return g ? [{ edge, g, box: edgeBounds(g) }] : [];
      }),
    [graph, index, path],
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

  const beginDrag = useMemo(
    () => (edge: FlowEdge, e: ReactPointerEvent<Element>, onDrop: (ev: PointerEvent) => void) => {
      const el = e.currentTarget as unknown as SVGElement;
      el.setPointerCapture?.(e.pointerId);
      setDrag({ edge, point: worldAt(flow, el, e.clientX, e.clientY) });
      const move = (ev: PointerEvent) =>
        setDrag({ edge, point: worldAt(flow, el, ev.clientX, ev.clientY) });
      const stop = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", stop);
        setDrag(null);
      };
      const up = (ev: PointerEvent) => {
        stop();
        onDrop(ev);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", stop);
    },
    [flow],
  );

  let budget = limit ?? Infinity;
  const preview = (() => {
    if (!drag) return null;
    const source = index.nodes.get(drag.edge.from.node);
    if (!source) return null;
    return path(portPoint(source, "out", drag.edge.from.port), drag.point).d;
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
            ctx={ctx}
            parts={registry.edgeParts}
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
            beginDrag={beginDrag}
          />
        );
      })}
      {preview ? (
        <path className="fg-flow-wire" d={preview} vectorEffect="non-scaling-stroke" />
      ) : null}
    </WorldSvg>
  );
}

/** The wire of a connection being made, from its port to the pointer or the port under it. */
export function FlowConnectionWire<D>({ ctx, view }: LayerProps<D>) {
  const { flow, core } = ctx;
  const connection = useConnection();
  const items = useCanvasState(flow.store, (s) => s.items);
  void items;
  const refusal = useSyncExternalStore(ctx.refusal.subscribe, ctx.refusal.get, ctx.refusal.get);
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
  const path = pathOf(core, view.edgeStyle);
  const d = h.side === "out" ? path(a, b).d : path(b, a).d;
  // Over a port that refuses: the rule's reason, at the pointer.
  const why = !over && refusal && refusal.from === connection.from.itemId ? refusal : null;
  return (
    <WorldSvg className="fg-flow-connecting" data-valid={over ? "" : undefined}>
      <path className="fg-flow-wire" d={d} vectorEffect="non-scaling-stroke" />
      {why ? (
        <g
          className="fg-flow-refusal"
          data-reason={why.reason}
          transform={`translate(${b.x + 14} ${b.y + 18})`}
        >
          <rect width={why.message.length * 6.6 + 16} height={22} />
          <text x={8} y={15}>
            {why.message}
          </text>
        </g>
      ) : null}
    </WorldSvg>
  );
}

export const edges = defineEditorPlugin({
  core: edgesCore,
  layers: {
    below: [{ id: "edges", order: 10, component: FlowEdges }],
    above: [{ id: "connection-wire", order: 10, component: FlowConnectionWire }],
  },
  handlers: {
    // A press on the surface (not on an edge, not on chrome) drops the edge selection.
    pointerDownCapture: ({ flow }, e) => {
      const t = e.target as Element;
      if (flow.selectedEdges.size === 0 || e.shiftKey) return;
      if (t.closest(".fg-flow-edge") || t.closest("[data-canvas-overlay]")) return;
      flow.selectEdges([]);
    },
  },
  toolbar: [
    {
      kind: "choice",
      id: "edge-style",
      label: "Edges",
      order: 200,
      when: (ctx, view) => !!view.onEdgeStyleChange && ctx.core.edgeStyles.length > 1,
      value: (_ctx, view) => view.edgeStyle,
      options: (ctx) => ctx.core.edgeStyles.map((s) => ({ value: s.id, label: s.spec.label })),
      set: (_ctx, value, view) => view.onEdgeStyleChange?.(value),
    },
  ],
});
