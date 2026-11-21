// Edit mode: drag a widget by its body, its corner to resize; arrows move, Shift and arrows resize.
// The layout is plain data: this page prints it.
import {
  Button,
  Gauge,
  Heatmap,
  StackedBar,
  WidgetFrame,
  WidgetGrid,
  type WidgetLayout,
} from "@forgeron/ui";
import { useState, type ReactNode } from "react";

const catalog: Record<string, { label: string; render: () => ReactNode }> = {
  quota: {
    label: "Quota",
    render: () => <Gauge title="Quarter" value={36} target={50} size={160} />,
  },
  mix: {
    label: "Channel mix",
    render: () => (
      <StackedBar
        title="Channels"
        normalize
        series={[
          { key: "mail", label: "Mail" },
          { key: "chat", label: "Chat" },
        ]}
        items={[
          { label: "Sales", values: { mail: 40, chat: 30 } },
          { label: "Support", values: { mail: 20, chat: 90 } },
        ]}
      />
    ),
  },
  heat: {
    label: "Activity",
    render: () => (
      <Heatmap
        title="Activity"
        rows={["Sales", "Ops"]}
        columns={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        values={[
          [4, 9, 12, 7, 3],
          [1, 3, 5, 8, 6],
        ]}
      />
    ),
  },
};

export default function Editable() {
  const [editing, setEditing] = useState(true);
  const [ids, setIds] = useState(["quota", "mix"]);
  const [layout, setLayout] = useState<WidgetLayout[]>([
    { id: "quota", x: 0, y: 0, w: 4, h: 3 },
    { id: "mix", x: 4, y: 0, w: 8, h: 3 },
  ]);
  const missing = Object.keys(catalog).filter((id) => !ids.includes(id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div>
        <Button size="sm" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit layout"}
        </Button>
      </div>
      <WidgetGrid
        editing={editing}
        rowHeight={110}
        layout={layout}
        onLayoutChange={setLayout}
        widgets={ids.map((id) => ({
          id,
          label: catalog[id]!.label,
          minW: 3,
          minH: 2,
          content: <WidgetFrame title={catalog[id]!.label}>{catalog[id]!.render()}</WidgetFrame>,
        }))}
        onRemoveWidget={(id) => setIds((now) => now.filter((x) => x !== id))}
        onAddWidget={missing.length ? () => setIds((now) => [...now, missing[0]!]) : undefined}
      />
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          font: "11.5px/18px var(--font-mono)",
          color: "var(--ink-muted)",
        }}
      >
        {JSON.stringify(layout)}
      </pre>
    </div>
  );
}
