import { IssueList, type IssueGroup, type IssueItem } from "@forgeron/ui";
import { useState } from "react";

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "feature", label: "Feature", color: "var(--accent)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
  { value: "warehouse", label: "Warehouse", color: "var(--warning)" },
];
const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
  { id: "np", name: "Nadia Petit" },
];
const start: IssueItem[] = [
  {
    id: "OPS-40",
    title: "Supplier invoices arrive twice from Odoo",
    status: "progress",
    priority: 1,
    labels: ["bug", "customer"],
    due: "2026-11-12",
    assignee: "hb",
    author: "cr",
  },
  {
    id: "OPS-37",
    title: "Carrier rates: import the new grid",
    status: "todo",
    priority: 2,
    labels: ["feature"],
    due: "2026-11-20",
    assignee: "cr",
    author: "lm",
  },
  {
    id: "OPS-29",
    title: "Quarterly safety walk, Lyon",
    status: "backlog",
    assignee: null,
    author: "np",
  },
];
const ORDER = ["progress", "todo", "backlog", "done"] as const;
const NAMES = { progress: "In Progress", todo: "Todo", backlog: "Backlog", done: "Done" };

export default function Editable() {
  const [issues, setIssues] = useState(start);
  const [last, setLast] = useState("Click a mark, or select a row and press S, P, A, L or D");
  const groups: IssueGroup[] = ORDER.map((s) => ({
    key: s,
    name: NAMES[s],
    status: s,
    issues: issues.filter((i) => i.status === s),
  }));
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <IssueList
        groups={groups}
        labels={labels}
        people={people}
        today="2026-11-17"
        defaultSelected="OPS-40"
        properties={["priority", "id", "status", "labels", "author", "assignee", "due"]}
        editors={{
          status: { statuses: ["backlog", "todo", "progress", "done"] },
          assignee: { me: "cr" },
          author: { me: "cr" },
        }}
        onIssueChange={(id, patch) => {
          setIssues((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)));
          setLast(`${id}: ${Object.keys(patch).join(", ")} changed`);
        }}
        onOpen={(id) => setLast(`Open ${id}`)}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
