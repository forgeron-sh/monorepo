import { ArrowUpRight01Icon, Copy01Icon, Delete02Icon } from "@forgeron/icons";
import { ContextMenu, STATUS_NAMES, StatusGlyph, type StatusKind } from "@forgeron/ui";
import { useState } from "react";

const statuses: StatusKind[] = ["todo", "progress", "review", "done"];

export default function RightClick() {
  const [status, setStatus] = useState<StatusKind>("todo");
  return (
    <div style={{ width: "100%" }}>
      <ContextMenu
        label="Actions on OPS-22"
        onSelect={(id) => {
          if (id.startsWith("status:")) setStatus(id.slice(7) as StatusKind);
        }}
        items={[
          {
            id: "status",
            label: "Status",
            glyph: <StatusGlyph status={status} />,
            kbd: "S",
            items: statuses.map((s) => ({
              id: `status:${s}`,
              label: STATUS_NAMES[s],
              glyph: <StatusGlyph status={s} />,
              checked: s === status,
            })),
          },
          { separator: true },
          { id: "open", label: "Open issue", icon: ArrowUpRight01Icon, kbd: "↵" },
          { id: "copy", label: "Copy ID", icon: Copy01Icon },
          { separator: true },
          { id: "delete", label: "Delete issue", icon: Delete02Icon, danger: true },
        ]}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 44,
            padding: "0 12px",
            border: "1px dashed var(--line-strong)",
            background: "var(--bg)",
          }}
        >
          <span style={{ color: "var(--ink-dim)", font: "400 11.5px/1 var(--font-mono)" }}>
            OPS-22
          </span>
          <StatusGlyph status={status} />
          <span style={{ flex: 1 }}>Fire exit signage audit</span>
          <span style={{ color: "var(--ink-dim)", font: "400 11.5px/1 var(--font-mono)" }}>
            Right click
          </span>
        </div>
      </ContextMenu>
    </div>
  );
}
