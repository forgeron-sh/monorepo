import { IssueBoard, type IssueGroup, type IssueItem } from "@forgeron/ui";
import { useState } from "react";

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "feature", label: "Feature", color: "var(--accent)" },
  { value: "warehouse", label: "Warehouse", color: "var(--warning)" },
];
const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
];
const start: IssueItem[] = [
  {
    id: "OPS-40",
    title: "Supplier invoices arrive twice from Odoo",
    status: "progress",
    priority: 1,
    labels: ["bug"],
    due: "2026-11-12",
    assignee: "hb",
  },
  {
    id: "OPS-37",
    title: "Carrier rates: import the new grid",
    status: "todo",
    priority: 2,
    labels: ["feature"],
    assignee: "cr",
  },
  { id: "OPS-29", title: "Quarterly safety walk, Lyon", status: "todo", assignee: null },
];
const ORDER = ["todo", "progress", "done"] as const;
const NAMES = { todo: "Todo", progress: "In Progress", done: "Done" };

export default function Editable() {
  const [issues, setIssues] = useState(start);
  const columns: IssueGroup[] = ORDER.map((s) => ({
    key: s,
    name: NAMES[s],
    status: s,
    issues: issues.filter((i) => i.status === s),
  }));
  return (
    <IssueBoard
      columns={columns}
      labels={labels}
      people={people}
      today="2026-11-17"
      defaultSelected="OPS-29"
      editors={{ status: { statuses: ORDER }, assignee: { me: "cr" } }}
      onIssueChange={(id, patch) =>
        setIssues((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)))
      }
      rowMenu={() => [{ id: "copy", label: "Copy ID" }]}
      onRowAction={() => {}}
    />
  );
}
