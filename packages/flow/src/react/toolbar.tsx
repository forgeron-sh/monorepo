// <FlowToolbar>: the flow's own commands, drawn by the `toolbar` plugin from what the other
// plugins contribute to its slot: auto-layout, the edge style. Place it in `<FlowCanvas>`'s
// children (over the surface) or anywhere around it. An editor without the `toolbar` plugin has no
// toolbar: this renders nothing.

import { useContext, useMemo } from "react";
import type { EdgeStyle } from "../core/geometry";
import { fullEditorPlugins } from "../plugins/editor/presets";
import { FlowEditorReactContext, makeContext } from "./context";
import { createEditorRegistry, type FlowView } from "./plugin";
import type { FlowApi } from "./use-flow";

export interface FlowToolbarProps<D> {
  flow: FlowApi<D>;
  edgeStyle?: EdgeStyle;
  /** Shows the edge style switch when given. */
  onEdgeStyleChange?: (style: EdgeStyle) => void;
  className?: string;
}

export function FlowToolbar<D>({
  flow,
  edgeStyle = "bezier",
  onEdgeStyleChange,
  className,
}: FlowToolbarProps<D>) {
  const inside = useContext(FlowEditorReactContext);
  // Inside <FlowCanvas> the toolbar is the one of its plugins; outside, of the `full` preset.
  const outside = useMemo(
    () => (inside ? null : makeContext(flow, createEditorRegistry<D>(fullEditorPlugins)).ctx),
    [inside, flow],
  );
  const ctx = (inside ?? outside) as NonNullable<typeof outside>;
  const view = useMemo<FlowView<D>>(
    () => ({
      run: undefined,
      edgeStyle,
      far: false,
      edgeLimit: null,
      gpu: false,
      hover: { edge: null, group: null },
      dragging: null,
      setDragging: () => undefined,
      controls: true,
      minimap: true,
      onEdgeStyleChange: onEdgeStyleChange as FlowView<D>["onEdgeStyleChange"],
      host: {},
    }),
    [edgeStyle, onEdgeStyleChange],
  );
  const Toolbar = ctx.registry.ui.toolbar;
  if (!Toolbar) return null;
  return <Toolbar ctx={ctx as never} view={view} className={className} />;
}
