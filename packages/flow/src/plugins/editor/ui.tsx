// The interface plugins, editor halves: delete, the far level, the toolbar, the zoom controls and
// the minimap. The toolbar plugin draws what the others contribute to the `toolbar` slot (its
// buttons are the tools of the plugins, its choices their options); without it there is no toolbar.

import { Minimap, ZoomControls } from "@forgeron/canvas/react";
import { IconButton, Segmented, Tooltip } from "@forgeron/ui";
import type { FlowItemData } from "../../core/items";
import { indexGraph } from "../../core/model";
import { nodeStatus, type RunStatus } from "../../core/run";
import {
  defineEditorPlugin,
  type FarEdge,
  type FlowEditorContext,
  type FlowView,
  type ToolbarViewProps,
} from "../../react/plugin";
import {
  deleteKeys as deleteCore,
  far as farCore,
  minimap as minimapCore,
  toolbar as toolbarCore,
  zoomControls as zoomCore,
} from "../ui";
import { farEdgeGroups, farGroups, farNode, groupFrames } from "./far-view";
import { pathOf } from "./surface";

export const deleteKeys = defineEditorPlugin({
  core: deleteCore,
  tools: {
    delete: {
      label: "Delete",
      run: ({ flow }) => {
        // Nothing selected: the key is not ours.
        if (flow.store.getState().selection.size === 0 && flow.selectedEdges.size === 0)
          return false;
        flow.deleteSelection(flow.selectedEdges);
        flow.selectEdges([]);
      },
    },
  },
  shortcuts: [{ keys: ["backspace", "delete"], tool: "delete" }],
});

export const far = defineEditorPlugin({
  core: farCore,
  far: {
    node: (node, { status, selected, label, farZoom, portColor }) =>
      farNode(node, status, label, selected, { farZoom, portColor }),
    edges: (ctx, graph, info, selected) => {
      // Each edge's shapes kept while its path and look stay: the canvas packs what changed.
      const cache = ctx.local("far:edges", () => new Map<string, { key: string; edge: FarEdge }>());
      return farEdgeGroups(
        indexGraph(graph),
        graph.edges,
        pathOf(ctx.core, info.edgeStyle),
        info.run,
        { selected, hover: info.hover, dragging: info.dragging, arrows: info.arrows },
        cache,
      );
    },
    groups: (ctx, graph, { hover }) => {
      const spec = ctx.core.groups;
      if (!spec || graph.groups.length === 0) return { frames: [], drawn: [] };
      const frames = groupFrames(indexGraph(graph), graph.groups, spec.bounds);
      return { frames, drawn: farGroups(frames, hover) };
    },
  },
});

function ToolbarView<D>({ ctx, view, className }: ToolbarViewProps<D>) {
  const { registry } = ctx;
  return (
    <div
      className={["fg-flow-toolbar", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="Flow"
    >
      {registry.toolbar.map((item) => {
        if (item.kind === "button") {
          if (item.when && !item.when(ctx)) return null;
          const tool = registry.tool(item.tool)!;
          return (
            <Tooltip key={item.id} content={tool.label} {...(tool.kbd ? { kbd: tool.kbd } : {})}>
              <IconButton
                icon={tool.icon as NonNullable<typeof tool.icon>}
                label={tool.label}
                onClick={() => void tool.run(ctx)}
              />
            </Tooltip>
          );
        }
        if (item.when && !item.when(ctx, view)) return null;
        return (
          <Segmented
            key={item.id}
            label={item.label}
            value={item.value(ctx, view)}
            onChange={(v) => item.set(ctx, v, view)}
            options={[...item.options(ctx)]}
          />
        );
      })}
    </div>
  );
}

export const toolbar = defineEditorPlugin({
  core: toolbarCore,
  ui: { toolbar: ToolbarView },
});

export const zoomControls = defineEditorPlugin({
  core: zoomCore,
  layers: {
    overlay: [
      {
        id: "zoom-controls",
        order: 10,
        component: ({ view }: { ctx: FlowEditorContext<unknown>; view: FlowView<unknown> }) =>
          view.controls ? <ZoomControls history /> : null,
      },
    ],
  },
});

const STATUS_COLOR: Partial<Record<RunStatus, string>> = {
  running: "--accent",
  success: "--success",
  error: "--danger",
  handled: "--danger",
  skipped: "--line",
};

export const minimap = defineEditorPlugin({
  core: minimapCore,
  layers: {
    overlay: [
      {
        id: "minimap",
        order: 20,
        component: ({ view }: { ctx: FlowEditorContext<unknown>; view: FlowView<unknown> }) =>
          view.minimap ? (
            <Minimap<FlowItemData<unknown>>
              colorOf={(item) => STATUS_COLOR[nodeStatus(view.run, item.id)]}
            />
          ) : null,
      },
    ],
  },
});
