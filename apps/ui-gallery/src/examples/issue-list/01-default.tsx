// Composed from parts: a group is its header (fold button, add button) and its rows. The parts are
// those of `RecordList`, under the issue's names; a group's `IssueGroup` is its `group`.
import {
  IssueList,
  IssueListAdd,
  IssueListGroup,
  IssueListHeader,
  IssueListRow,
  IssueListRows,
  IssueListToggle,
  type IssueGroup,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];
const groups: IssueGroup[] = [
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
    ],
  },
  {
    key: "todo",
    name: "Todo",
    status: "todo",
    issues: [{ id: "OPS-42", title: "Archive 2024 delivery notes", status: "todo", priority: 4 }],
  },
];

export default function Composed() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ width: 360, display: "grid", gap: 8 }}>
      <IssueList
        groups={groups}
        people={people}
        properties={["priority", "id", "status", "assignee"]}
        defaultSelected="OPS-40"
        onAdd={(key) => setLast(key)}
      >
        {groups.map((group) => (
          <IssueListGroup key={group.key} group={group}>
            <IssueListHeader>
              <IssueListToggle />
              <IssueListAdd />
            </IssueListHeader>
            <IssueListRows>
              {group.issues.map((issue) => (
                <IssueListRow key={issue.id} record={issue} />
              ))}
            </IssueListRows>
          </IssueListGroup>
        ))}
      </IssueList>
      {last ? <span className="t-mono">Add to {last}</span> : null}
    </div>
  );
}
