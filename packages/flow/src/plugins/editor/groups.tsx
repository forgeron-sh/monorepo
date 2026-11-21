// Groups, editor half: the frames under the edges, each with a label that selects the group's
// nodes. The frame is computed from the nodes each time, by the core half's `bounds`.

import { WorldSvg } from "@forgeron/canvas/react";
import { useMemo } from "react";
import { indexGraph } from "../../core/model";
import { defineEditorPlugin, type LayerProps } from "../../react/plugin";
import { groups as groupsCore } from "../groups";
import { focusSurface } from "./surface";

/** The frames of the groups, under the edges; a label that selects the group's nodes. */
export function FlowGroups<D>({ ctx, view }: LayerProps<D>) {
  const { flow, core } = ctx;
  const graph = flow.current;
  const index = useMemo(() => indexGraph(graph), [graph]);
  const spec = core.groups;
  if (!spec || graph.groups.length === 0) return null;
  if (view.gpu) return <GroupButtons ctx={ctx} />;
  return (
    <WorldSvg className="fg-flow-groups">
      {graph.groups.map((g) => {
        const b = spec.bounds(index, g.nodes);
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

/**
 * On the GPU, the frames and labels are drawn there and the host takes a press on a label (it
 * finds it by its box); each label is still a real button for the keyboard and assistive
 * technology, offscreen (over the drawing, a few dozen buttons would each be a compositing layer):
 * Enter or Space selects the group's nodes, as a press does.
 */
function GroupButtons<D>({ ctx }: { ctx: LayerProps<D>["ctx"] }) {
  const { flow, core } = ctx;
  const graph = flow.current;
  const index = useMemo(() => indexGraph(graph), [graph]);
  const spec = core.groups!;
  const select = (nodes: ReadonlyArray<string>, add: boolean, el: Element) => {
    flow.store.select(nodes, add ? "add" : "replace");
    flow.selectEdges([]);
    focusSurface(el);
  };
  return (
    <div className="fg-visually-hidden fg-flow-group-buttons">
      {graph.groups.map((g) => {
        if (!spec.bounds(index, g.nodes)) return null;
        return (
          <button
            key={g.id}
            type="button"
            className="fg-flow-group-button"
            data-group-label={g.id}
            aria-label={`Select the group ${g.label}`}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              select(g.nodes, e.shiftKey, e.currentTarget);
            }}
          />
        );
      })}
    </div>
  );
}

export const groups = defineEditorPlugin({
  core: groupsCore,
  layers: { below: [{ id: "group-frames", order: 0, component: FlowGroups }] },
});
