// Composed from parts: the columns are the values of a groupable field, and each one draws its
// header, its cards and, here, a button to add a project.
import {
  projectFields,
  RecordBoard,
  RecordBoardAdd,
  RecordBoardCard,
  RecordBoardCards,
  RecordBoardColumn,
  RecordBoardColumnActions,
  RecordBoardColumnHeader,
  RecordBoardColumnToggle,
  recordGroups,
  type ProjectItem,
} from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];
const projects: ProjectItem[] = [
  {
    id: "p1",
    name: "Q4 closing",
    status: "started",
    health: "risk",
    lead: "cr",
    target: "2026-12-15",
    issues: 24,
    done: 11,
  },
  {
    id: "p2",
    name: "Supplier portal",
    status: "started",
    health: "track",
    lead: "hb",
    target: "2027-01-30",
    issues: 40,
    done: 9,
  },
  { id: "p3", name: "Odoo bridge", status: "planned", lead: null, issues: 12, done: 0 },
];
const context = { people, today: "2026-11-17" };

export default function Composed() {
  const columns = recordGroups(projectFields, projects, "status", context);
  return (
    <RecordBoard
      fields={projectFields}
      titleField="name"
      noun="project"
      label="Projects"
      context={context}
      columns={columns}
      onAdd={() => {}}
      properties={["health", "lead", "target"]}
    >
      {columns.map((column) => (
        <RecordBoardColumn key={column.key} column={column}>
          <RecordBoardColumnHeader>
            <RecordBoardColumnToggle />
            <RecordBoardColumnActions />
          </RecordBoardColumnHeader>
          <RecordBoardCards>
            {column.records.map((record) => (
              <RecordBoardCard key={record.id} record={record} />
            ))}
            <RecordBoardAdd />
          </RecordBoardCards>
        </RecordBoardColumn>
      ))}
    </RecordBoard>
  );
}
