import { IssueList } from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
];

export default function Default() {
  return (
    <div style={{ width: 300 }}>
      <IssueList
        people={people}
        properties={["priority", "id", "status", "assignee"]}
        defaultSelected="OPS-40"
        groups={[
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
                assignee: "hb",
              },
              {
                id: "OPS-37",
                title: "Carrier rates: import the new grid",
                status: "progress",
                priority: 2,
                assignee: "cr",
              },
              {
                id: "OPS-29",
                title: "Quarterly safety walk, Lyon",
                status: "progress",
                priority: 3,
                assignee: "lm",
              },
            ],
          },
        ]}
      />
    </div>
  );
}
