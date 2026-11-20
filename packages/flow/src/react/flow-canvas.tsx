// <FlowCanvas>: a flow on the canvas. Each node is a canvas item whose body is the consumer's
// (`renderNode`: a StepCard with layout="node" in the automations), with its ports as connect
// handles on its sides. Edges and group frames are drawn in a layer under the nodes. The canvas
// keys stay the canvas's; delete, duplicate, copy, cut and paste are the flow's, so that edges go
// with their nodes and come back with a paste.

import { type Point } from "@forgeron/canvas";
import {
  animateViewport,
  Canvas,
  Minimap,
  useCanvasState,
  ZoomControls,
  type CanvasFar,
  type CanvasProps,
} from "@forgeron/canvas/react";
import { matchShortcut } from "@forgeron/ui";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { parseHandle, portHandle } from "../core/controller";
import { farEdges, farNode } from "../core/far";
import { portOffset, type EdgeStyle } from "../core/geometry";
import { isNodeItem, NODE_KIND, nodeOfItem, type FlowItemData } from "../core/items";
import { indexGraph } from "../core/model";
import type { FlowEdge, FlowNode, PortSide } from "../core/model";
import { nodeStatus, type RunState, type RunStatus } from "../core/run";
import { FlowConnectionWire, FlowEdges, FlowGroups } from "./layers";
import type { FlowApi } from "./use-flow";

export interface FlowNodeState {
  selected: boolean;
  status: RunStatus;
}

export interface FlowCanvasProps<D> {
  flow: FlowApi<D>;
  /** The body of a node, inside its box: a `StepCard layout="node"` for an automation. */
  renderNode: (node: FlowNode<D>, state: FlowNodeState) => ReactNode;
  /** Names the surface for assistive technology: "Automation editor". */
  label: string;
  /** Names a node for assistive technology; `<type> <id>` by default. */
  nodeLabel?: (node: FlowNode<D>) => string;
  /** The state of a run to show: node outlines, edge colours, items flowing. */
  run?: RunState;
  /** `bezier` (default) or `orthogonal`. */
  edgeStyle?: EdgeStyle;
  /** A connection dropped on nothing: open a step picker there, add a node connected to `from`. */
  onConnectEnd?: (from: { node: string; port: string; side: PortSide }, point: Point) => void;
  /** The "+" halfway along an edge: insert a step there. */
  onInsert?: (edge: FlowEdge, point: Point) => void;
  /** Double click or Enter on a node: open it. */
  onNodeActivate?: (node: FlowNode<D>) => void;
  onSurfaceDoubleClick?: (point: Point) => void;
  /** The zoom controls with undo and redo; on by default. */
  controls?: boolean;
  /** The minimap, coloured by run state; on by default. */
  minimap?: boolean;
  /**
   * Below this zoom, nodes are drawn as plain labelled boxes instead of `renderNode` (level of
   * detail: hundreds of rich cards cost too much to paint when they are all in view). 0.4 by
   * default; 0 always draws `renderNode`.
   */
  farZoom?: number;
  /** Passed to the canvas: `pan` (default) or `zoom`. */
  wheel?: CanvasProps<FlowItemData<D>>["wheel"];
  /** More chrome over the surface. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** DOM edges mounted on the first frame back from far; twice as many each frame after. */
const EDGES_FIRST = 32;

const FIELD = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const isField = (t: EventTarget | null) => t instanceof Element && t.closest(FIELD) !== null;

const STATUS_COLOR: Partial<Record<RunStatus, string>> = {
  running: "--accent",
  success: "--success",
  error: "--danger",
  handled: "--danger",
  skipped: "--line",
};

interface PortsProps {
  side: PortSide;
  ports: FlowNode["inputs"];
  height: number;
}

function Ports({ side, ports, height }: PortsProps) {
  const labelled = ports.length > 1;
  return (
    <>
      {ports.map((p, i) => (
        <span
          key={p.id}
          className="fg-flow-port"
          data-side={side}
          data-type={p.type}
          data-canvas-handle={portHandle(side, p.id)}
          title={`${side === "in" ? "Input" : "Output"} ${p.label ?? p.id}${p.type ? ` · ${p.type}` : ""}`}
          aria-hidden="true"
          style={{ top: portOffset(height, i, ports.length) }}
        >
          {labelled || p.label ? (
            <span className="fg-flow-port-label">{p.label ?? p.id}</span>
          ) : null}
        </span>
      ))}
    </>
  );
}

interface NodeViewProps<D> {
  node: FlowNode<D>;
  selected: boolean;
  status: RunStatus;
  render: (node: FlowNode<D>, state: FlowNodeState) => ReactNode;
}

function NodeViewInner<D>({ node, selected, status, render }: NodeViewProps<D>) {
  return (
    <div className="fg-flow-node" data-status={status === "idle" ? undefined : status}>
      <div className="fg-flow-node-body">{render(node, { selected, status })}</div>
      <Ports side="in" ports={node.inputs} height={node.size.h} />
      <Ports side="out" ports={node.outputs} height={node.size.h} />
    </div>
  );
}
const NodeView = memo(NodeViewInner) as typeof NodeViewInner;

export function FlowCanvas<D>({
  flow,
  renderNode,
  label,
  nodeLabel,
  run,
  edgeStyle = "bezier",
  onConnectEnd,
  onInsert,
  onNodeActivate,
  onSurfaceDoubleClick,
  controls = true,
  farZoom = 0.4,
  minimap = true,
  wheel,
  children,
  className,
  style,
}: FlowCanvasProps<D>) {
  const { store } = flow;
  const pasteHandled = useRef(true);
  const copied = useRef<string | null>(null);

  // Re-renders this only when the zoom crosses `farZoom`, not at every step; the nodes learn it
  // from the canvas (`state.far`), which switches them a few at a time.
  const far = useCanvasState(store, (s) => s.viewport.zoom < farZoom);
  const renderItem = useCallback(
    (
      item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0],
      { selected, far }: { selected: boolean; far: boolean },
    ) => {
      if (!isNodeItem<D>(item)) return null;
      const node = nodeOfItem(item);
      const status = nodeStatus(run, node.id);
      if (far) {
        return (
          <div className="fg-flow-node-far" data-status={status === "idle" ? undefined : status}>
            {nodeLabel ? nodeLabel(node) : node.id}
          </div>
        );
      }
      return <NodeView node={node} selected={selected} status={status} render={renderNode} />;
    },
    [run, renderNode, nodeLabel],
  );

  // Back from far, the DOM edges come back a few dozen a frame (`edgeLimit`, null: all of them),
  // while the far layer still draws every edge under them.
  const graph = flow.current;
  const [edgeLimit, setEdgeLimit] = useState<number | null>(null);
  const [wasFar, setWasFar] = useState(far);
  if (wasFar !== far) {
    setWasFar(far);
    setEdgeLimit(far ? null : EDGES_FIRST);
  }
  useEffect(() => {
    if (edgeLimit === null) return;
    const next = () =>
      setEdgeLimit((n) => (n === null || n * 2 >= graph.edges.length ? null : n * 2));
    if (typeof requestAnimationFrame !== "function") {
      const id = setTimeout(next, 16);
      return () => clearTimeout(id);
    }
    const id = requestAnimationFrame(next);
    return () => cancelAnimationFrame(id);
  }, [edgeLimit, graph.edges.length]);

  // The far view on the GPU: nodes as labelled boxes, every edge as its line and arrowhead. The
  // edges are packed when the graph, the run or the edge selection change, only while far or
  // while the DOM edges come back.
  const selectedEdges = flow.selectedEdges;
  const edgesOnGpu = far || edgeLimit !== null;
  const farBelow = useMemo(
    () =>
      edgesOnGpu
        ? farEdges(indexGraph(graph), graph.edges, edgeStyle, run, selectedEdges)
        : undefined,
    [edgesOnGpu, graph, edgeStyle, run, selectedEdges],
  );
  const farKinds = useMemo<CanvasFar<FlowItemData<D>>["kinds"]>(
    () => ({
      [NODE_KIND]: (item, { selected }) => {
        if (!isNodeItem<D>(item)) return null;
        const node = nodeOfItem(item);
        return farNode(
          node,
          nodeStatus(run, node.id),
          nodeLabel ? nodeLabel(node) : node.id,
          selected,
        );
      },
    }),
    [run, nodeLabel],
  );
  const farView = useMemo<CanvasFar<FlowItemData<D>>>(
    () => ({ zoom: farZoom, kinds: farKinds, ...(farBelow ? { below: farBelow } : {}) }),
    [farZoom, farKinds, farBelow],
  );

  const itemLabel = useCallback(
    (item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0]) => {
      const fallback = `${item.kind} ${item.id}`;
      if (!isNodeItem<D>(item)) return fallback;
      const node = nodeOfItem(item);
      const status = nodeStatus(run, node.id);
      const name = nodeLabel ? nodeLabel(node) : `${node.type} ${node.id}`;
      return status === "idle" ? name : `${name}, ${status}`;
    },
    [nodeLabel, run],
  );

  const layers = useMemo(
    () => ({
      below: (
        <>
          <FlowGroups flow={flow} />
          <FlowEdges
            flow={flow}
            style={edgeStyle}
            run={run}
            onInsert={onInsert}
            far={far}
            limit={edgeLimit}
          />
        </>
      ),
      above: <FlowConnectionWire flow={flow} style={edgeStyle} />,
    }),
    [flow, edgeStyle, run, onInsert, far, edgeLimit],
  );

  const onConnect = useCallback(
    (
      from: { itemId: string; handle?: string },
      to: { itemId: string; handle?: string } | null,
      point: Point,
    ) => {
      if (to) {
        flow.connectEnds(from, to);
        return;
      }
      const h = parseHandle(from.handle);
      if (h) onConnectEnd?.({ node: from.itemId, port: h.port, side: h.side }, point);
    },
    [flow, onConnectEnd],
  );
  const canConnect = useCallback(
    (from: { itemId: string; handle?: string }, to: { itemId: string; handle?: string }) =>
      flow.canConnectEnds(from, to),
    [flow],
  );
  const onItemActivate = useMemo(
    () =>
      onNodeActivate
        ? (item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0]) => {
            if (isNodeItem<D>(item)) onNodeActivate(nodeOfItem(item));
          }
        : undefined,
    [onNodeActivate],
  );

  const onKeyDownCapture = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isField(e.target) || store.readOnly) return;
    const k = e.nativeEvent;
    const take = (prevent = true) => {
      if (prevent) e.preventDefault();
      e.stopPropagation();
    };
    if (matchShortcut(k, "backspace") || matchShortcut(k, "delete")) {
      if (store.getState().selection.size === 0 && flow.selectedEdges.size === 0) return;
      flow.deleteSelection(flow.selectedEdges);
      flow.selectEdges([]);
      take();
    } else if (matchShortcut(k, "mod+d")) {
      flow.duplicateSelection();
      take();
    } else if (matchShortcut(k, "mod+c") || matchShortcut(k, "mod+x")) {
      // The native copy event follows and puts the JSON on the system clipboard.
      copied.current = flow.copySelection();
      if (copied.current && matchShortcut(k, "mod+x")) flow.deleteSelection();
      take(false);
    } else if (matchShortcut(k, "mod+v")) {
      // The native paste event reads the system clipboard; without one, the last copy is pasted.
      pasteHandled.current = false;
      setTimeout(() => {
        if (!pasteHandled.current) flow.paste();
        pasteHandled.current = true;
      }, 0);
      take(false);
    } else if (matchShortcut(k, "shift+l")) {
      layoutAndFit();
      take();
    }
  };

  const layoutAndFit = () => {
    flow.autoLayout();
    animateViewport(store, store.fitViewport({ padding: 48, maxZoom: 1 }));
  };

  const onCopy = (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (isField(e.target) || !copied.current) return;
    e.clipboardData.setData("text/plain", copied.current);
    copied.current = null;
    e.preventDefault();
  };
  const onPaste = (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (isField(e.target) || store.readOnly) return;
    pasteHandled.current = true;
    const text = e.clipboardData.getData("text/plain");
    const pasted = text ? flow.paste(text) : [];
    if (pasted.length === 0) flow.paste();
    e.preventDefault();
  };
  const onPointerDownCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = e.target as Element;
    if (flow.selectedEdges.size === 0 || e.shiftKey) return;
    if (t.closest(".fg-flow-edge") || t.closest("[data-canvas-overlay]")) return;
    flow.selectEdges([]);
  };

  return (
    <div
      className={["fg-flow", className].filter(Boolean).join(" ")}
      style={style}
      onKeyDownCapture={onKeyDownCapture}
      onPointerDownCapture={onPointerDownCapture}
      onCopy={onCopy}
      onPaste={onPaste}
    >
      <Canvas<FlowItemData<D>>
        store={store}
        label={label}
        renderItem={renderItem}
        far={farView}
        itemLabel={itemLabel}
        layers={layers}
        onConnect={onConnect}
        canConnect={canConnect}
        {...(onItemActivate ? { onItemActivate } : {})}
        {...(onSurfaceDoubleClick ? { onSurfaceDoubleClick } : {})}
        {...(wheel ? { wheel } : {})}
        className="fg-flow-canvas"
      >
        {controls ? <ZoomControls history /> : null}
        {minimap ? (
          <Minimap<FlowItemData<D>> colorOf={(item) => STATUS_COLOR[nodeStatus(run, item.id)]} />
        ) : null}
        {children}
      </Canvas>
    </div>
  );
}
