// Composed from parts: each column writes its own header and lane, and the lane ends with a button
// to add an issue. The parts are those of `RecordBoard`, under the issue's names.
import {
  IssueBoard,
  IssueBoardAdd,
  IssueBoardCard,
  IssueBoardCards,
  IssueBoardColumn,
  IssueBoardColumnActions,
  IssueBoardColumnHeader,
  IssueBoardColumnToggle,
  type IssueGroup,
} from "@forgeron/ui";

const people = [
  { id: "hb", name: "Hugo Bernard" },
  { id: "np", name: "Nadia Petit" },
];
const labels = [
  { value: "bug", label: "Bug", color: "var(--danger)" },
  { value: "warehouse", label: "Warehouse", color: "var(--warning)" },
];
const columns: IssueGroup[] = [
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
        labels: ["bug"],
        assignee: "hb",
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
];

export default function Composed() {
  return (
    <IssueBoard
      columns={columns}
      people={people}
      labels={labels}
      today="2026-11-17"
      onAdd={() => {}}
      showCounts
    >
      {columns.map((column) => (
        <IssueBoardColumn key={column.key} column={column}>
          <IssueBoardColumnHeader>
            <IssueBoardColumnToggle />
            <IssueBoardColumnActions />
          </IssueBoardColumnHeader>
          <IssueBoardCards>
            {column.issues.map((issue) => (
              <IssueBoardCard key={issue.id} record={issue} />
            ))}
            <IssueBoardAdd />
          </IssueBoardCards>
        </IssueBoardColumn>
      ))}
    </IssueBoard>
  );
}
