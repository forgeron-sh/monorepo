import { ArrowUpRight01Icon, Copy01Icon, Delete02Icon } from "@forgeron/icons";
import { IssueList, StatusGlyph, type ActionMenuEntry, type IssueItem } from "@forgeron/ui";
import { useState } from "react";

const start: IssueItem[] = [
  {
    id: "OPS-40",
    title: "Supplier invoices arrive twice from Odoo",
    status: "progress",
    priority: 1,
  },
  { id: "OPS-37", title: "Carrier rates: import the new grid", status: "todo", priority: 2 },
  { id: "OPS-29", title: "Quarterly safety walk, Lyon", status: "backlog", priority: 3 },
];
const STATES = ["backlog", "todo", "progress", "done"] as const;
const NAMES = { backlog: "Backlog", todo: "Todo", progress: "In Progress", done: "Done" };

const menuOf = (issue: IssueItem): ActionMenuEntry[] => [
  {
    id: "status",
    label: "Status",
    glyph: <StatusGlyph status={issue.status} />,
    items: STATES.map((s) => ({
      id: `status:${s}`,
      label: NAMES[s],
      glyph: <StatusGlyph status={s} />,
      checked: issue.status === s,
    })),
  },
  { separator: true },
  { id: "open", label: "Open issue", icon: ArrowUpRight01Icon, kbd: "↵" },
  { id: "copy", label: "Copy ID", icon: Copy01Icon },
  { separator: true },
  { id: "delete", label: "Delete issue", icon: Delete02Icon, danger: true },
];

export default function RowMenu() {
  const [issues, setIssues] = useState(start);
  const [last, setLast] = useState("Right-click a row, press Shift+F10, or use its ⋯");
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <IssueList
        groups={[{ key: "all", name: "All issues", issues }]}
        properties={["priority", "id", "status"]}
        rowMenu={menuOf}
        onRowAction={(id, action) => {
          if (action.startsWith("status:")) {
            const status = action.slice(7) as IssueItem["status"];
            setIssues((all) => all.map((i) => (i.id === id ? { ...i, status } : i)));
          }
          if (action === "delete") setIssues((all) => all.filter((i) => i.id !== id));
          setLast(`${action} on ${id}`);
        }}
        onOpen={(id) => setLast(`Open ${id}`)}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
