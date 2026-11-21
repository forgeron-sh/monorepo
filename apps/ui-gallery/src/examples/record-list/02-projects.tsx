import {
  FilterBar,
  projectFields,
  RecordList,
  useRecordView,
  type ProjectItem,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
];
const start: ProjectItem[] = [
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

/** The same RecordList as the issues', on projectFields: no new block. */
export default function Projects() {
  const [projects, setProjects] = useState(start);
  const view = useRecordView(projects, projectFields, context, {
    skip: ["name"],
    defaultDisplay: {
      layout: "list",
      grouping: "status",
      ordering: "target",
      toggles: {},
      properties: ["status", "health", "lead", "target"],
    },
  });
  return (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <FilterBar fields={view.filterFields} value={view.filters} onChange={view.setFilters} />
      <RecordList
        fields={projectFields}
        titleField="name"
        noun="project"
        label="Projects"
        context={context}
        groups={view.groups}
        properties={view.display.properties}
        onRecordChange={(id, patch) =>
          setProjects((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        }
      />
    </div>
  );
}
