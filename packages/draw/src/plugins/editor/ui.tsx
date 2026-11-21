// The interface plugins, editor half: they draw the slots of the editor. `toolbar` is the tool dock
// (select and hand, then every tool the plugins bring, then their buttons), `inspector` the
// properties panel, `minimap` the overview. Without one, that part of the interface is not there;
// the keys of the tools work without the dock.

import { Minimap, useCanvasState } from "@forgeron/canvas/react";
import { Cursor01Icon, HandGrabIcon } from "@forgeron/icons";
import { CanvasToolbar, ToolbarButton, type EditorTool } from "@forgeron/ui";
import type { DrawData } from "../../core/types";
import { Inspector } from "../../react/inspector";
import { defineEditorPlugin, type UiProps } from "../../react/plugin";
import { inspector as inspectorCore, minimap as minimapCore, toolbar as toolbarCore } from "../ui";

export { arrange } from "./arrange";

function Dock({ ctx, slots }: UiProps) {
  const tool = useCanvasState(ctx.store, (s) => s.tool);
  const tools: EditorTool[] = [
    { id: "select", label: "Select", icon: Cursor01Icon, shortcut: "v", group: "pick" },
    { id: "pan", label: "Hand", icon: HandGrabIcon, shortcut: "h", group: "pick" },
    ...slots.tools.flatMap((t) =>
      t.dock
        ? [
            {
              id: t.id,
              label: t.label,
              icon: t.dock.icon,
              ...(t.shortcut ? { shortcut: t.shortcut } : {}),
              group: t.dock.group,
            },
          ]
        : [],
    ),
  ];
  const value = tools.some((t) => t.id === tool) ? tool : "select";
  return (
    <div className="fgd-dock">
      <CanvasToolbar
        label="Drawing tools"
        tools={tools}
        value={value}
        onChange={(id) => ctx.store.setTool(id)}
        shortcuts={false}
        floating
      >
        {slots.toolbar.map((b) => (
          <ToolbarButton
            key={b.id}
            label={b.label}
            icon={b.icon}
            className="fg-edt-tool"
            onClick={() => b.run(ctx)}
          />
        ))}
      </CanvasToolbar>
    </div>
  );
}

function Properties({ ctx, slots, style, onStyle }: UiProps) {
  return <Inspector store={ctx.store} slots={slots} ctx={ctx} style={style} onStyle={onStyle} />;
}

function Overview({ slots }: UiProps) {
  return (
    <Minimap
      colorOf={(item) =>
        slots.kinds.get(item.kind)?.minimapColor ??
        ((item.data as DrawData | null)?.type === "frame" ? "--line-strong" : undefined)
      }
    />
  );
}

export const toolbar = defineEditorPlugin({
  core: toolbarCore,
  ui: [{ id: "toolbar", Component: Dock }],
});

export const inspector = defineEditorPlugin({
  core: inspectorCore,
  ui: [{ id: "inspector", Component: Properties }],
});

export const minimap = defineEditorPlugin({
  core: minimapCore,
  ui: [{ id: "minimap", placement: "after-zoom", Component: Overview }],
});
