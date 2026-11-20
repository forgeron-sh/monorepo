// The flow editor in React: a canvas store holding the graph, the controller that edits it, the
// graph as it is now (re-read when the items change, not when the camera moves) and the edges
// selected (edges are not canvas items, so their selection lives here).

import type { GridOptions } from "@forgeron/canvas";
import { useCanvasState } from "@forgeron/canvas/react";
import { createCanvasStore } from "@forgeron/canvas";
import { useCallback, useMemo, useState } from "react";
import {
  createFlowController,
  type FlowController,
  type FlowControllerOptions,
} from "../core/controller";
import { flowKinds, graphToItems, type FlowItemData } from "../core/items";
import { emptyGraph, type FlowGraph } from "../core/model";
import type { FlowCorePlugin } from "../core/plugin";

/** A plugin of a list: its two halves (`{ core, ... }`), or a core half alone. */
type PluginEntry = FlowCorePlugin | { readonly core: FlowCorePlugin };
const coreOf = (p: PluginEntry): FlowCorePlugin => ("core" in p ? p.core : p);

export interface UseFlowOptions<D> extends Omit<FlowControllerOptions, "plugins"> {
  /** The graph to start from; later values are ignored (use `flow.load`). */
  graph?: FlowGraph<D>;
  /**
   * The plugins of the editor, editor halves or core halves (the `full` preset's when none): they
   * decide the rules a connection answers to, the layout, the clipboard. `<FlowCanvas>` draws the
   * same list unless it is given its own. Keep the list stable (module scope).
   */
  plugins?: ReadonlyArray<PluginEntry>;
  grid?: Partial<GridOptions>;
  readOnly?: boolean;
}

export interface FlowApi<D = unknown> extends FlowController<D> {
  /** The plugin list `useFlow` was given, for `<FlowCanvas>` to draw; undefined for the default. */
  pluginList: ReadonlyArray<PluginEntry> | undefined;
  /** The graph now; a new object after each change of the document. */
  current: FlowGraph<D>;
  selectedEdges: ReadonlySet<string>;
  /** Replaces the selected edges, or toggles these ones. */
  selectEdges: (ids: Iterable<string>, mode?: "replace" | "toggle") => void;
}

const NONE: ReadonlySet<string> = new Set();

export function useFlow<D = unknown>(options: UseFlowOptions<D> = {}): FlowApi<D> {
  const [controller] = useState(() => {
    const store = createCanvasStore<FlowItemData<D>>({
      items: graphToItems(options.graph ?? emptyGraph<D>()),
      kinds: flowKinds<D>(),
      ...(options.grid ? { grid: options.grid } : {}),
      ...(options.readOnly ? { readOnly: true } : {}),
    });
    const { plugins, ...rest } = options;
    return createFlowController(store, {
      ...rest,
      ...(plugins ? { plugins: plugins.map(coreOf) } : {}),
    });
  });
  const pluginList = options.plugins;
  const items = useCanvasState(controller.store, (s) => s.items);
  // The controller caches the graph by the items it was read from.
  const current = useMemo(() => {
    void items;
    return controller.graph();
  }, [controller, items]);
  const [selectedEdges, setSelected] = useState<ReadonlySet<string>>(NONE);
  // Edges deleted by an undo or another edit leave the selection.
  const live = useMemo(() => {
    if (selectedEdges.size === 0) return NONE;
    const known = new Set(current.edges.map((e) => e.id));
    const kept = [...selectedEdges].filter((id) => known.has(id));
    return kept.length === selectedEdges.size ? selectedEdges : new Set(kept);
  }, [current, selectedEdges]);
  const selectEdges = useCallback(
    (ids: Iterable<string>, mode: "replace" | "toggle" = "replace") => {
      setSelected((prev) => {
        if (mode === "replace") {
          const next = new Set(ids);
          return next.size === 0 && prev.size === 0 ? prev : next;
        }
        const next = new Set(prev);
        for (const id of ids) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        }
        return next;
      });
    },
    [],
  );
  return useMemo(
    () => ({ ...controller, pluginList, current, selectedEdges: live, selectEdges }),
    [controller, pluginList, current, live, selectEdges],
  );
}
