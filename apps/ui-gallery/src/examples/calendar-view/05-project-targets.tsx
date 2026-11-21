// The projects preset in a calendar: the date field and the status mark are read off its fields.
import { CalendarView, projectFields, type ProjectItem } from "@forgeron/ui";

const projects: ProjectItem[] = [
  { id: "lyon", name: "Lyon depot", status: "started", target: "2026-11-24", issues: 24, done: 11 },
  { id: "q4", name: "Q4 closing", status: "started", target: "2026-11-27", issues: 9, done: 6 },
  {
    id: "rates",
    name: "Carrier rates",
    status: "planned",
    target: "2026-11-27",
    issues: 5,
    done: 0,
  },
  { id: "audit", name: "Safety audit", status: "paused", target: "2026-12-03", issues: 7, done: 2 },
  {
    id: "pack",
    name: "Auditor pack",
    status: "completed",
    target: "2026-11-12",
    issues: 4,
    done: 4,
  },
  { id: "later", name: "Yard resurfacing", status: "planned", issues: 0, done: 0 },
];

export default function ProjectTargets() {
  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <CalendarView
        records={projects}
        fields={projectFields}
        dateField="target"
        labelField="name"
        markField="status"
        today="2026-11-18"
      />
    </div>
  );
}
