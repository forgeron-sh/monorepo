// <FlowCanvas>: a flow on the canvas, drawn by a list of plugins. Each node is a canvas item whose
// body is a plugin's (the `nodes` plugin draws `renderNode`, the consumer's: a StepCard with
// layout="node" in the automations), with its ports as connect handles on its sides. Edges, group
// frames, the zoom controls and the minimap are layers other plugins contribute; the keys and the
// native copy and paste events are theirs too. The host here is the minimum: the surface, the node
// frame with its ports, the level of detail, and the slots. A kind of node no plugin draws is kept
// as a labelled dashed box.

import { screenToWorld, type Point } from "@forgeron/canvas";
import { Canvas, useCanvasState, type CanvasFar, type CanvasProps } from "@forgeron/canvas/react";
import { matchShortcut } from "@forgeron/ui";
import {
  memo,
  useCallback,
  useLayoutEffect,
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
import type { EdgeStyle } from "../core/geometry";
import { isNodeItem, NODE_KIND, nodeOfItem, type FlowItemData } from "../core/items";
import { portOffset } from "../core/geometry";
import type { FlowEdge, FlowNode, PortSide } from "../core/model";
import type { Registry } from "../core/plugin";
import { nodeStatus, type RunState, type RunStatus } from "../core/run";
import { edgeAt, groupLabelAt } from "../plugins/editor/far-view";
import { presetPlugins, type FlowPreset } from "../plugins/editor/presets";
import { focusSurface } from "../plugins/editor/surface";
import { FlowEditorReactContext, makeContext } from "./context";
import {
  createEditorRegistry,
  listKey,
  type EditorRegistry,
  type FlowEditorContext,
  type FlowHost,
  type FlowNodeState,
  type FlowPluginEntry,
  type FlowView,
  type NodeRenderer,
} from "./plugin";
import type { FlowApi } from "./use-flow";

export interface FlowCanvasProps<D> {
  flow: FlowApi<D>;
  /** The body of a node, inside its box: a `StepCard layout="node"` for an automation. */
  renderNode?: (node: FlowNode<D>, state: FlowNodeState) => ReactNode;
  /** Names the surface for assistive technology: "Automation editor". */
  label: string;
  /** Names a node for assistive technology; `<type> <id>` by default. */
  nodeLabel?: (node: FlowNode<D>) => string;
  /**
   * The plugins of this editor: editor halves, or core halves alone. The `full` preset when none
   * (or the list `useFlow` was given). Keep the list stable (module scope): a new list rebuilds
   * the editor.
   */
  plugins?: ReadonlyArray<FlowPluginEntry<D>>;
  /** Sugar for a bundled list when `plugins` is not given: `minimal`, `typed` or `full`. */
  preset?: FlowPreset;
  /** The state of a run to show: node outlines, edge colours, items flowing. */
  run?: RunState;
  /** The id of an edge style a plugin brings: `bezier` (default) or `orthogonal`. */
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
   * Below this zoom, nodes are drawn as plain labelled boxes instead of their body (level of
   * detail: hundreds of rich cards cost too much to paint when they are all in view). 0.4 by
   * default; 0 always draws the bodies. Needs a plugin that brings the far view.
   */
  farZoom?: number;
  /** Passed to the canvas: `pan` (default) or `zoom`. */
  wheel?: CanvasProps<FlowItemData<D>>["wheel"];
  /** More chrome over the surface. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Every node has a DOM body near (its card): the canvas mounts it over the GPU's box. */
const ALL = () => true;
const NO_HOVER = { edge: null, group: null } as const;
/** How far from an edge's line a press still takes it, in screen pixels (`.fg-flow-edge-hit`). */
const EDGE_REACH = 6;

const FIELD = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const isField = (t: EventTarget | null) => t instanceof Element && t.closest(FIELD) !== null;

interface PortsProps {
  side: PortSide;
  ports: FlowNode["inputs"];
  height: number;
  core: Registry;
}

function Ports({ side, ports, height, core }: PortsProps) {
  const labelled = ports.length > 1;
  return (
    <>
      {ports.map((p, i) => {
        const color = p.type ? core.portType(p.type)?.color : undefined;
        return (
          <span
            key={p.id}
            className="fg-flow-port"
            data-side={side}
            data-type={p.type}
            data-colored={color ? "" : undefined}
            data-canvas-handle={portHandle(side, p.id)}
            title={`${side === "in" ? "Input" : "Output"} ${p.label ?? p.id}${p.type ? ` · ${p.type}` : ""}`}
            aria-hidden="true"
            style={
              {
                top: portOffset(height, i, ports.length),
                ...(color ? { "--fg-flow-port-color": `var(${color})` } : {}),
              } as CSSProperties
            }
          >
            {labelled || p.label ? (
              <span className="fg-flow-port-label">{p.label ?? p.id}</span>
            ) : null}
          </span>
        );
      })}
    </>
  );
}

interface NodeViewProps<D> {
  node: FlowNode<D>;
  selected: boolean;
  status: RunStatus;
  render: NodeRenderer<D> | undefined;
  host: FlowHost<D>;
  core: Registry;
}

function NodeViewInner<D>({ node, selected, status, render, host, core }: NodeViewProps<D>) {
  return (
    <div className="fg-flow-node" data-status={status === "idle" ? undefined : status}>
      <div className="fg-flow-node-body">
        {render ? (
          render(node, { selected, status }, host)
        ) : (
          // No plugin draws this kind: kept as it is, drawn as what it is.
          <div className="fg-flow-node-unknown" data-unknown={node.type}>
            {node.type || "node"} · {node.id}
          </div>
        )}
      </div>
      <Ports side="in" ports={node.inputs} height={node.size.h} core={core} />
      <Ports side="out" ports={node.outputs} height={node.size.h} core={core} />
    </div>
  );
}
const NodeView = memo(NodeViewInner) as typeof NodeViewInner;

/** The panels over the surface about the selection; mounted only when a plugin brings one. */
function Inspectors<D>({
  ctx,
  registry,
}: {
  ctx: FlowEditorContext<D>;
  registry: EditorRegistry<D>;
}) {
  const { flow } = ctx;
  const selection = useCanvasState(flow.store, (s) => s.selection);
  const graph = flow.current;
  const nodes = useMemo(() => graph.nodes.filter((n) => selection.has(n.id)), [graph, selection]);
  const edges = useMemo(() => [...flow.selectedEdges], [flow.selectedEdges]);
  if (nodes.length === 0 && edges.length === 0) return null;
  return (
    <>
      {registry.inspector.map((i) => (
        <i.component key={i.id} ctx={ctx} nodes={nodes} edges={edges} />
      ))}
    </>
  );
}

interface BodyProps<D> extends Omit<FlowCanvasProps<D>, "plugins" | "preset"> {
  registry: EditorRegistry<D>;
}

export function FlowCanvas<D>(props: FlowCanvasProps<D>) {
  const { flow, plugins, preset } = props;
  // The list is the app's (`plugins`), a named preset, the one `useFlow` was given, or `full`.
  const list = (plugins ??
    (preset ? presetPlugins(preset) : flow.pluginList) ??
    presetPlugins("full")) as ReadonlyArray<FlowPluginEntry<D>>;
  // `setPlugins` is the controller's own function: the same for the life of the flow.
  const { setPlugins } = flow;
  const registry = useMemo(() => {
    const made = createEditorRegistry<D>(list);
    // The rules of a connection follow the plugins drawn. It only touches the controller:
    // nothing React reads changes.
    setPlugins(made.core);
    return made;
  }, [list, setPlugins]);
  // A new list rebuilds the body: what plugins hold per editor is dropped with it.
  return <FlowBody key={listKey(list)} {...props} registry={registry} />;
}

function FlowBody<D>({
  flow,
  registry,
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
}: BodyProps<D>) {
  const { store } = flow;
  const core = registry.core;
  const farSlot = registry.far;
  const shownRun = registry.showsRun ? run : undefined;

  // Re-renders this only when the zoom crosses `farZoom`, not at every step; the nodes learn it
  // from the canvas (`state.far`), which switches them a few at a time.
  const far = useCanvasState(store, (s) => !!farSlot && s.viewport.zoom < farZoom);

  const host = useMemo<FlowHost<D>>(() => ({ renderNode, nodeLabel }), [renderNode, nodeLabel]);

  const renderItem = useCallback(
    (
      item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0],
      { selected, far }: { selected: boolean; far: boolean },
    ) => {
      if (!isNodeItem<D>(item)) return null;
      const node = nodeOfItem(item);
      const status = nodeStatus(shownRun, node.id);
      if (far) {
        return (
          <div className="fg-flow-node-far" data-status={status === "idle" ? undefined : status}>
            {nodeLabel ? nodeLabel(node) : node.id}
          </div>
        );
      }
      return (
        <NodeView
          node={node}
          selected={selected}
          status={status}
          render={registry.nodeRenderer(node.type)}
          host={host}
          core={core}
        />
      );
    },
    [shownRun, registry, host, core, nodeLabel],
  );

  // On the GPU (a plugin brings the far view), every edge and group frame is drawn there at every
  // zoom; the pointer finds them by their shapes. Without it, everything is DOM.
  const graph = flow.current;
  const gpu = !!farSlot;
  const [hover, setHover] = useState<{ edge: string | null; group: string | null }>(NO_HOVER);
  const [dragging, setDragging] = useState<string | null>(null);

  const view = useMemo<FlowView<D>>(
    () => ({
      run: shownRun,
      edgeStyle,
      far,
      edgeLimit: null,
      gpu,
      hover,
      dragging,
      setDragging,
      controls,
      minimap,
      onInsert,
      host,
    }),
    [shownRun, edgeStyle, far, gpu, hover, dragging, controls, minimap, onInsert, host],
  );
  const [locals] = useState(() => new Map<string, unknown>());
  const made = useMemo(() => makeContext(flow, registry, locals), [flow, registry, locals]);
  const { ctx, setView } = made;
  // What handlers read of the view: the one of the last render, set once it is committed.
  useLayoutEffect(() => setView(view));

  // The flow on the GPU: each node's box (its card over it near; a labelled box with its ports
  // from far), the group frames, then every edge, one canvas group each, so a change packs only
  // what it touches.
  const selectedEdges = flow.selectedEdges;
  const arrows = useMemo(() => registry.edgeParts.some((p) => p.id === "arrowhead"), [registry]);
  const farEdges = useMemo(
    () =>
      farSlot?.edges?.(
        ctx,
        graph,
        { run: shownRun, edgeStyle, hover: hover.edge, dragging, arrows },
        selectedEdges,
      ) ?? [],
    [farSlot, ctx, graph, shownRun, edgeStyle, hover.edge, dragging, arrows, selectedEdges],
  );
  const farFrames = useMemo(
    () => farSlot?.groups?.(ctx, graph, { hover: hover.group }) ?? { frames: [], drawn: [] },
    [farSlot, ctx, graph, hover.group],
  );
  const farBelow = useMemo(
    () => [...farFrames.drawn, ...farEdges.map((e) => e.group)],
    [farFrames, farEdges],
  );
  const portColor = useCallback(
    (type: string | undefined) => (type ? core.portType(type)?.color : undefined),
    [core],
  );
  const farKinds = useMemo<CanvasFar<FlowItemData<D>>["kinds"]>(
    () => ({
      [NODE_KIND]: (item, { selected, shown }) => {
        // Its card is mounted over it (near, or focused): nothing under it, the card may be
        // translucent (a skipped step).
        if (!isNodeItem<D>(item) || !farSlot || shown) return null;
        const node = nodeOfItem(item);
        return farSlot.node(node, {
          status: nodeStatus(shownRun, node.id),
          selected,
          label: nodeLabel ? nodeLabel(node) : node.id,
          farZoom,
          portColor,
        });
      },
    }),
    [shownRun, nodeLabel, farSlot, farZoom, portColor],
  );
  const farView = useMemo<CanvasFar<FlowItemData<D>> | undefined>(
    () =>
      farSlot
        ? {
            zoom: farZoom,
            kinds: farKinds,
            below: farBelow,
            overlay: ALL,
            chromeOverDom: true,
          }
        : undefined,
    [farSlot, farZoom, farKinds, farBelow],
  );

  // What is under the pointer on the GPU: an edge (within its click reach) or a group's label.
  const shapes = useRef({ edges: farEdges, frames: farFrames.frames });
  useLayoutEffect(() => {
    shapes.current = { edges: farEdges, frames: farFrames.frames };
  }, [farEdges, farFrames]);
  const pick = useCallback(
    (e: { target: EventTarget | null; clientX: number; clientY: number }) => {
      const t = e.target as Element | null;
      const surface = t?.closest?.<HTMLElement>(".fg-canvas");
      if (!t || !surface) return null;
      // An edge's own parts (its insert button) keep it; a node, a port or chrome hide what is under.
      const part = t.closest<HTMLElement>("[data-edge]");
      if (part) return { edge: part.dataset.edge ?? null, group: null };
      if (
        t.closest(
          "[data-canvas-item], [data-canvas-overlay], [data-canvas-handle], [data-canvas-interactive]",
        )
      )
        return null;
      const r = surface.getBoundingClientRect();
      const v = store.getState().viewport;
      const p = screenToWorld(v, { x: e.clientX - r.left, y: e.clientY - r.top });
      const group = groupLabelAt(shapes.current.frames, p);
      if (group) return { edge: null, group: group.id };
      const edge = edgeAt(shapes.current.edges, p, EDGE_REACH / v.zoom);
      return edge ? { edge: edge.id, group: null } : null;
    },
    [store],
  );
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!gpu || e.buttons) return;
    const next = pick(e) ?? NO_HOVER;
    if (next.edge !== hover.edge || next.group !== hover.group) setHover(next);
  };
  const onPointerLeave = () => {
    if (hover.edge || hover.group) setHover(NO_HOVER);
  };

  const itemLabel = useCallback(
    (item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0]) => {
      const fallback = `${item.kind} ${item.id}`;
      if (!isNodeItem<D>(item)) return fallback;
      const node = nodeOfItem(item);
      const status = nodeStatus(shownRun, node.id);
      const name = nodeLabel ? nodeLabel(node) : `${node.type} ${node.id}`;
      return status === "idle" ? name : `${name}, ${status}`;
    },
    [nodeLabel, shownRun],
  );

  const itemRole = useCallback(
    (item: Parameters<CanvasProps<FlowItemData<D>>["renderItem"]>[0]) => {
      if (!isNodeItem<D>(item)) return "item";
      const node = nodeOfItem(item);
      return ((core.kind(node.type)?.label ?? node.type) || "node").toLowerCase();
    },
    [core],
  );

  const layers = useMemo(
    () => ({
      below: (
        <>
          {registry.below.map((l) => (
            <l.component key={l.id} ctx={ctx} view={view} />
          ))}
        </>
      ),
      above: (
        <>
          {registry.above.map((l) => (
            <l.component key={l.id} ctx={ctx} view={view} />
          ))}
        </>
      ),
    }),
    [registry, ctx, view],
  );

  const onConnect = useCallback(
    (
      from: { itemId: string; handle?: string },
      to: { itemId: string; handle?: string } | null,
      point: Point,
    ) => {
      ctx.refusal.set(null);
      if (to) {
        flow.connectEnds(from, to);
        return;
      }
      const h = parseHandle(from.handle);
      if (h) onConnectEnd?.({ node: from.itemId, port: h.port, side: h.side }, point);
    },
    [flow, ctx, onConnectEnd],
  );
  const canConnect = useCallback(
    (from: { itemId: string; handle?: string }, to: { itemId: string; handle?: string }) => {
      const why = flow.refusal(from, to);
      // The wire layer says why, while the pointer is over a port that refuses.
      ctx.refusal.set(why ? { ...why, from: from.itemId } : null);
      return flow.canConnectEnds(from, to);
    },
    [flow, ctx],
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

  // The keys are the plugins': each names a tool. The first shortcut that matches and whose tool
  // takes the key wins; the canvas's own keys follow for the rest.
  const onKeyDownCapture = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isField(e.target) || store.readOnly) return;
    const k = e.nativeEvent;
    for (const s of registry.shortcuts) {
      const keys = typeof s.keys === "string" ? [s.keys] : s.keys;
      if (!keys.some((key) => matchShortcut(k, key))) continue;
      const result = registry.tool(s.tool)!.run(ctx, k);
      if (result === false) continue;
      if (result !== "native") e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  const onCopy = (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (isField(e.target)) return;
    for (const h of registry.handlers) {
      h.copy?.(ctx, e.nativeEvent);
      if (e.defaultPrevented) return;
    }
  };
  const onPaste = (e: ReactClipboardEvent<HTMLDivElement>) => {
    if (isField(e.target) || store.readOnly) return;
    for (const h of registry.handlers) {
      h.paste?.(ctx, e.nativeEvent);
      if (e.defaultPrevented) return;
    }
  };
  const onPointerDownCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    // On the GPU, a press on an edge's line or a group's label is theirs, not the canvas's (which
    // would start a box): what the DOM's paths and label did.
    const hit =
      gpu && e.button === 0 && !(e.target as Element).closest("[data-edge]") ? pick(e) : null;
    if (hit) {
      e.stopPropagation();
      e.preventDefault();
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (hit.group) {
        const g = graph.groups.find((x) => x.id === hit.group);
        if (g) store.select(g.nodes, e.shiftKey ? "add" : "replace");
        flow.selectEdges([]);
      } else if (hit.edge) {
        if (!additive) store.clearSelection();
        flow.selectEdges([hit.edge], additive ? "toggle" : "replace");
      }
      focusSurface(e.target as Element);
      return;
    }
    for (const h of registry.handlers) h.pointerDownCapture?.(ctx, e.nativeEvent);
  };

  return (
    <FlowEditorReactContext.Provider value={ctx}>
      <div
        className={["fg-flow", className].filter(Boolean).join(" ")}
        style={hover.edge || hover.group ? { ...style, cursor: "pointer" } : style}
        onKeyDownCapture={onKeyDownCapture}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onCopy={onCopy}
        onPaste={onPaste}
      >
        <Canvas<FlowItemData<D>>
          store={store}
          label={label}
          renderItem={renderItem}
          {...(farView ? { far: farView } : {})}
          itemLabel={itemLabel}
          itemRole={itemRole}
          layers={layers}
          onConnect={onConnect}
          canConnect={canConnect}
          {...(onItemActivate ? { onItemActivate } : {})}
          {...(onSurfaceDoubleClick ? { onSurfaceDoubleClick } : {})}
          {...(wheel ? { wheel } : {})}
          className="fg-flow-canvas"
        >
          {registry.overlay.map((l) => (
            <l.component key={l.id} ctx={ctx} view={view} />
          ))}
          {registry.inspector.length > 0 ? <Inspectors ctx={ctx} registry={registry} /> : null}
          {children}
        </Canvas>
      </div>
    </FlowEditorReactContext.Provider>
  );
}
