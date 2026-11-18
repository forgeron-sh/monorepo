import { IssueBoard } from "@forgeron/ui";
import { useState } from "react";

const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "feature", label: "Feature", color: "var(--accent)" },
  { value: "improvement", label: "Improvement", color: "var(--ink-muted)" },
  { value: "customer", label: "Customer", color: "var(--success)" },
  { value: "warehouse", label: "Warehouse", color: "var(--warning)" },
];
const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
  { id: "np", name: "Nadia Petit" },
  { id: "tg", name: "Tom Garnier" },
];

export default function ByStatus() {
  const [last, setLast] = useState("Click a card, a + or a ⋯");
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <IssueBoard
        labels={labels}
        people={people}
        today="2026-11-17"
        defaultCollapsed={["done"]}
        onOpen={(id) => setLast(`Open ${id}`)}
        onAdd={(column) => setLast(`New issue in ${column}`)}
        onColumnMenu={(column) => setLast(`Options of ${column}`)}
        columns={[
          {
            key: "todo",
            name: "Todo",
            status: "todo",
            issues: [
              {
                id: "OPS-29",
                title: "Quarterly safety walk, Lyon",
                status: "todo",
                priority: 3,
                labels: ["warehouse"],
                due: "2026-12-05",
                assignee: "tg",
              },
              {
                id: "OPS-42",
                title: "Pallet labels print off-centre",
                status: "todo",
                priority: 4,
                labels: ["improvement"],
              },
            ],
          },
          {
            key: "progress",
            name: "In Progress",
            status: "progress",
            issues: [
              {
                id: "OPS-40",
                title: "Supplier invoices arrive twice from Odoo",
                status: "progress",
                priority: 1,
                labels: ["bug", "customer"],
                due: "2026-11-12",
                assignee: "hb",
              },
              {
                id: "OPS-37",
                title: "Carrier rates: import the new grid",
                status: "progress",
                priority: 2,
                labels: ["feature"],
                assignee: "cr",
              },
            ],
          },
          {
            key: "review",
            name: "In Review",
            status: "review",
            issues: [
              {
                id: "OPS-34",
                title: "Fire exit signage audit",
                status: "review",
                priority: 3,
                labels: ["warehouse"],
                due: "2026-11-18",
                assignee: "np",
              },
            ],
          },
          {
            key: "done",
            name: "Done",
            status: "done",
            issues: [
              {
                id: "OPS-33",
                title: "Badge readers at the Lyon dock",
                status: "done",
                assignee: "lm",
              },
            ],
          },
        ]}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
