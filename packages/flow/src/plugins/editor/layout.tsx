// The auto-layout, editor half: the `layout` tool (lay the flow out as one undo step, then fit it
// in view), its key (Shift+L) and its toolbar button. The algorithm is the core half's; this half
// only asks the engine of the plugin list and animates the view.

import { animateViewport } from "@forgeron/canvas/react";
import { HierarchySquare04Icon } from "@forgeron/icons";
import { defineEditorPlugin } from "../../react/plugin";
import { layeredLayout } from "../layout";

export const layout = defineEditorPlugin({
  core: layeredLayout,
  tools: {
    layout: {
      label: "Auto-layout",
      icon: HierarchySquare04Icon,
      kbd: "⇧L",
      run: ({ flow }) => {
        flow.autoLayout();
        animateViewport(flow.store, flow.store.fitViewport({ padding: 48, maxZoom: 1 }));
      },
    },
  },
  shortcuts: [{ keys: "shift+l", tool: "layout" }],
  toolbar: [
    {
      kind: "button",
      id: "layout",
      tool: "layout",
      order: 100,
      when: (ctx) => !ctx.flow.store.readOnly,
    },
  ],
});
