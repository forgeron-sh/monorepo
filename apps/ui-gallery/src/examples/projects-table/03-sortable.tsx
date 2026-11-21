import { ProjectsTable } from "@forgeron/ui";
import { Folder01Icon, Invoice01Icon, PackageIcon } from "@forgeron/icons";
import { useState } from "react";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "hb", name: "Hugo Bernard" },
  { id: "np", name: "Nadia Petit" },
  { id: "tg", name: "Tom Garnier" },
];

export default function Sortable() {
  const [opened, setOpened] = useState("Click a row or a header");
  return (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <ProjectsTable
        people={people}
        today="2026-11-17"
        sortable
        columns={["lead", "target", "issues", "progress", "status"]}
        defaultSort={{ key: "target", direction: "asc" }}
        onOpen={(id) => setOpened(`Open ${id}`)}
        projects={[
          {
            id: "lyon",
            name: "Lyon depot",
            summary: "Everything before the first delivery",
            icon: PackageIcon,
            status: "started",
            health: "risk",
            lead: "tg",
            target: "2026-12-15",
            issues: 12,
            done: 5,
            started: 4,
          },
          {
            id: "q4",
            name: "Year-end closing",
            summary: "Invoices, stock count, accruals",
            icon: Invoice01Icon,
            status: "planned",
            health: "none",
            lead: "np",
            target: "2027-01-31",
            issues: 8,
            done: 0,
          },
          {
            id: "carriers",
            name: "Carrier rates",
            summary: "The 2027 grid in every quote",
            icon: Folder01Icon,
            status: "started",
            health: "track",
            lead: "cr",
            target: "2026-11-28",
            issues: 6,
            done: 4,
            started: 1,
          },
          {
            id: "safety",
            name: "Site safety",
            icon: Folder01Icon,
            status: "paused",
            health: "off",
            lead: null,
            target: "2026-12-01",
            issues: 5,
            done: 1,
          },
          {
            id: "badges",
            name: "Dock badges",
            icon: Folder01Icon,
            status: "completed",
            health: "track",
            lead: "hb",
            target: "2026-10-30",
            issues: 4,
            done: 4,
          },
        ]}
      />
      <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--ink-dim)" }}>{opened}</span>
    </div>
  );
}
