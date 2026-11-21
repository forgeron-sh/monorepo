import { projectFields, RecordBoard, recordGroups, type ProjectItem } from "@forgeron/ui";

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
  {
    id: "p4",
    name: "Warehouse audit",
    status: "completed",
    health: "track",
    lead: "cr",
    target: "2026-10-31",
    issues: 8,
    done: 8,
  },
];
const context = { people, today: "2026-11-17" };

/** Columns are the values of a groupable field: here the status of a project. */
export default function ProjectBoard() {
  return (
    <RecordBoard
      fields={projectFields}
      titleField="name"
      noun="project"
      label="Projects"
      context={context}
      properties={["health", "lead", "target"]}
      columns={recordGroups(projectFields, projects, "status", context, { keepEmpty: true })}
    />
  );
}
