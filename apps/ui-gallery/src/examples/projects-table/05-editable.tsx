import { Folder01Icon } from "@forgeron/icons";
import { ProjectsTable, type ProjectItem } from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "lm", name: "Léa Martin" },
];
const start: ProjectItem[] = [
  {
    id: "lyon",
    name: "Lyon depot",
    icon: Folder01Icon,
    status: "started",
    health: "risk",
    lead: "hb",
    target: "2026-12-15",
    issues: 12,
    done: 5,
    started: 4,
  },
  {
    id: "carriers",
    name: "Carrier rates",
    color: "var(--warning)",
    status: "started",
    health: "track",
    lead: "cr",
    target: "2026-11-28",
    issues: 6,
    done: 4,
    started: 1,
  },
  {
    id: "q4",
    name: "Year-end closing",
    color: "var(--success)",
    status: "planned",
    lead: null,
    target: "2027-01-31",
    issues: 8,
    done: 0,
  },
];

export default function Editable() {
  const [projects, setProjects] = useState(start);
  const [last, setLast] = useState("Click a field to change it; right-click a row for its menu");
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <ProjectsTable
        projects={projects}
        people={people}
        today="2026-11-17"
        columns={["health", "lead", "target", "status"]}
        editors={{ lead: { me: "cr" } }}
        onProjectChange={(id, patch) => {
          setProjects((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));
          setLast(`${id}: ${Object.keys(patch).join(", ")} changed`);
        }}
        onOpen={(id) => setLast(`Open ${id}`)}
        rowMenu={(p) => [
          { id: "open", label: `Open ${p.name}` },
          { separator: true },
          { id: "archive", label: "Archive", danger: true },
        ]}
        onRowAction={(id, action) => setLast(`${action} on ${id}`)}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{last}</span>
    </div>
  );
}
