import { IssueBoard } from "@forgeron/ui";

// The board for the grids: two columns of one card each, so the card shows whole columns
// instead of the top of a long lane.

export default function IssueBoardThumbnail() {
  return (
    <div className="thumb thumb-board">
      <IssueBoard
        people={[
          { id: "hb", name: "Hugo Bernard" },
          { id: "np", name: "Nadia Petit" },
        ]}
        labels={[
          { value: "bug", label: "Bug", color: "var(--danger)" },
          { value: "warehouse", label: "Warehouse", color: "var(--warning)" },
        ]}
        today="2026-11-17"
        columns={[
          {
            key: "progress",
            name: "In Progress",
            status: "progress",
            issues: [
              {
                id: "OPS-34",
                title: "Fire exit signage audit",
                status: "progress",
                priority: 3,
                labels: ["warehouse"],
                due: "2026-11-18",
                assignee: "np",
              },
            ],
          },
          {
            key: "review",
            name: "In Review",
            status: "review",
            issues: [
              {
                id: "OPS-40",
                title: "Supplier invoices arrive twice",
                status: "review",
                priority: 1,
                labels: ["bug"],
                assignee: "hb",
              },
            ],
          },
        ]}
      />
    </div>
  );
}
