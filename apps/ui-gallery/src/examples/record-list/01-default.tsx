// Composed from parts: the groups of a list of projects, each with its header and its rows. The
// list keeps the current row, the arrows and the folded groups; the parts only lay them out.
import {
  projectFields,
  RecordList,
  RecordListAdd,
  RecordListGroup,
  RecordListHeader,
  RecordListRow,
  RecordListRows,
  RecordListToggle,
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
    issues: 24,
    done: 11,
  },
  {
    id: "p2",
    name: "Supplier portal",
    status: "started",
    health: "track",
    lead: "hb",
    issues: 40,
    done: 9,
  },
  { id: "p3", name: "Odoo bridge", status: "planned", lead: null, issues: 12, done: 0 },
];
const context = { people, today: "2026-11-17" };

export default function Composed() {
  const groups = recordGroups(projectFields, projects, "status", context);
  return (
    <RecordList
      fields={projectFields}
      titleField="name"
      noun="project"
      label="Projects"
      context={context}
      groups={groups}
      onAdd={() => {}}
    >
      {groups.map((group) => (
        <RecordListGroup key={group.key} group={group}>
          <RecordListHeader>
            <RecordListToggle />
            <RecordListAdd />
          </RecordListHeader>
          <RecordListRows>
            {group.records.map((record) => (
              <RecordListRow key={record.id} record={record} />
            ))}
          </RecordListRows>
        </RecordListGroup>
      ))}
    </RecordList>
  );
}
