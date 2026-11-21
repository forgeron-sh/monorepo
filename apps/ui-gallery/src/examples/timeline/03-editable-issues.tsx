// Issues from useListView, grouped by status, as they would sit in a list view. Drag a bar, its
// edges, or press Alt and the arrows on a row to change its dates.
import {
  STATUS_NAMES,
  StatusGlyph,
  Timeline,
  useListView,
  type IssueItem,
  type StatusKind,
  type ViewSpec,
} from "@forgeron/ui";
import { useState } from "react";

type Planned = IssueItem & { start?: string };

const STATUSES: StatusKind[] = ["progress", "todo", "backlog"];
const COLORS: Partial<Record<StatusKind, string>> = {
  progress: "var(--accent)",
  todo: "var(--ink-muted)",
};

const initial: Planned[] = [
  {
    id: "OPS-40",
    title: "Supplier invoices arrive twice",
    status: "progress",
    start: "2026-11-10",
    due: "2026-11-20",
  },
  {
    id: "OPS-37",
    title: "Carrier rates: import the new grid",
    status: "progress",
    start: "2026-11-16",
    due: "2026-11-27",
  },
  {
    id: "OPS-41",
    title: "Dock schedule for Lyon",
    status: "todo",
    start: "2026-11-23",
    due: "2026-12-04",
  },
  { id: "OPS-38", title: "Fire exit signage audit", status: "todo", due: "2026-11-19" },
  { id: "OPS-35", title: "Quarterly safety walk", status: "backlog", due: "2026-12-02" },
];

const spec: ViewSpec<Planned> = {
  read: (issue, field) => (field === "status" ? issue.status : null),
  groupings: {
    status: { key: (i) => i.status, order: STATUSES, name: (k) => STATUS_NAMES[k as StatusKind] },
  },
};

export default function EditableIssues() {
  const [issues, setIssues] = useState(initial);
  const [last, setLast] = useState("Drag a bar, or Alt and the arrows on a row");
  const view = useListView(issues, spec, {
    defaultDisplay: {
      layout: "timeline",
      grouping: "status",
      ordering: "",
      toggles: {},
      properties: [],
    },
  });
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <div style={{ height: 340, display: "flex", border: "1px solid var(--line)" }}>
        <Timeline
          groups={view.groups.map((g) => ({
            ...g,
            glyph: <StatusGlyph status={g.key as StatusKind} />,
          }))}
          getColor={(i) => COLORS[i.status]}
          today="2026-11-18"
          defaultZoom="weeks"
          onOpen={(id) => setLast(`Open ${id}`)}
          onChange={(id, { start, end }) => {
            setIssues((all) =>
              all.map((i) =>
                i.id === id ? { ...i, start: start ?? undefined, due: end ?? undefined } : i,
              ),
            );
            setLast(`${id}: ${start ?? "no start"} → ${end ?? "no end"}`);
          }}
        />
      </div>
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
