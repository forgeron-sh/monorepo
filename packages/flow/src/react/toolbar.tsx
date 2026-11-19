// <FlowToolbar>: the flow's own commands, built from the atoms of `@forgeron/ui` like the canvas's
// zoom controls: auto-layout, and the edge style. Place it in `<FlowCanvas>`'s children (over the
// surface) or anywhere around it.

import { animateViewport } from "@forgeron/canvas/react";
import { HierarchySquare04Icon } from "@forgeron/icons";
import { IconButton, Segmented, Tooltip } from "@forgeron/ui";
import type { EdgeStyle } from "../core/geometry";
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
  const readOnly = flow.store.readOnly;
  return (
    <div
      className={["fg-flow-toolbar", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="Flow"
    >
      {readOnly ? null : (
        <Tooltip content="Auto-layout" kbd="⇧L">
          <IconButton
            icon={HierarchySquare04Icon}
            label="Auto-layout"
            onClick={() => {
              flow.autoLayout();
              animateViewport(flow.store, flow.store.fitViewport({ padding: 48, maxZoom: 1 }));
            }}
          />
        </Tooltip>
      )}
      {onEdgeStyleChange ? (
        <Segmented
          label="Edges"
          value={edgeStyle}
          onChange={(v) => onEdgeStyleChange(v as EdgeStyle)}
          options={[
            { value: "bezier", label: "Curves" },
            { value: "orthogonal", label: "Steps" },
          ]}
        />
      ) : null}
    </div>
  );
}
