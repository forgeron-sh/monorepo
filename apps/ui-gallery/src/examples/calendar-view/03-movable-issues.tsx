// Issues from useListView placed on their due date. Drag one to another day, or focus it (Enter
// on a day) and press Alt and the arrows. "+n more" opens the week.
import {
  CalendarView,
  STATUS_NAMES,
  useListView,
  type IssueItem,
  type StatusKind,
  type ViewSpec,
} from "@forgeron/ui";
import { useState } from "react";

const COLORS: Partial<Record<StatusKind, string>> = {
  progress: "var(--accent)",
  review: "var(--warning)",
  done: "var(--success)",
};

const initial: IssueItem[] = [
  { id: "OPS-40", title: "Supplier invoices arrive twice", status: "progress", due: "2026-11-18" },
  {
    id: "OPS-37",
    title: "Carrier rates: import the new grid",
    status: "progress",
    due: "2026-11-18",
  },
  { id: "OPS-38", title: "Fire exit signage audit", status: "review", due: "2026-11-18" },
  { id: "OPS-41", title: "Dock schedule for Lyon", status: "todo", due: "2026-11-18" },
  { id: "OPS-42", title: "Label printer jams on 4x6", status: "todo", due: "2026-11-18" },
  { id: "OPS-35", title: "Quarterly safety walk", status: "todo", due: "2026-11-24" },
  { id: "OPS-30", title: "Archive last year's delivery notes", status: "done", due: "2026-11-09" },
  { id: "OPS-33", title: "Badge readers at the Lyon dock", status: "backlog" },
];

const spec: ViewSpec<IssueItem> = {
  read: (issue, field) => (field === "status" ? issue.status : null),
  orderings: { status: (a, b) => STATUS_NAMES[a.status].localeCompare(STATUS_NAMES[b.status]) },
};

export default function MovableIssues() {
  const [issues, setIssues] = useState(initial);
  const [last, setLast] = useState("Drag an issue to another day");
  const view = useListView(issues, spec, {
    defaultDisplay: {
      layout: "calendar",
      grouping: "none",
      ordering: "status",
      toggles: {},
      properties: [],
    },
  });
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <div style={{ border: "1px solid var(--line)" }}>
        <CalendarView
          records={view.records}
          getColor={(i) => COLORS[i.status]}
          today="2026-11-18"
          onOpen={(id) => setLast(`Open ${id}`)}
          onChange={(id, due) => {
            setIssues((all) => all.map((i) => (i.id === id ? { ...i, due } : i)));
            setLast(`${id} moved to ${due}`);
          }}
        />
      </div>
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
