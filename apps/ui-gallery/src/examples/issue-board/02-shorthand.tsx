import { IssueBoard } from "@forgeron/ui";

export default function Default() {
  return (
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
          key: "review",
          name: "In Review",
          status: "review",
          issues: [
            {
              id: "OPS-40",
              title: "Supplier invoices arrive twice from Odoo",
              status: "review",
              priority: 1,
              labels: ["bug"],
              assignee: "hb",
            },
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
      ]}
    />
  );
}
