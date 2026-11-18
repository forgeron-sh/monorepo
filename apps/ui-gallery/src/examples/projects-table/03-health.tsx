import { ProjectsTable } from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy" },
  { id: "np", name: "Nadia Petit" },
  { id: "tg", name: "Tom Garnier" },
];

export default function Health() {
  return (
    <div style={{ width: "100%" }}>
      <ProjectsTable
        people={people}
        columns={["health", "lead", "progress"]}
        projects={[
          {
            id: "lyon",
            name: "Lyon depot",
            color: "var(--accent)",
            status: "started",
            health: "risk",
            lead: "tg",
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
            issues: 6,
            done: 4,
            started: 1,
          },
          {
            id: "safety",
            name: "Site safety",
            color: "var(--danger)",
            status: "paused",
            health: "off",
            lead: null,
            issues: 5,
            done: 1,
          },
          {
            id: "q4",
            name: "Year-end closing",
            color: "var(--success)",
            status: "planned",
            health: "none",
            lead: "np",
            issues: 8,
            done: 0,
          },
        ]}
      />
    </div>
  );
}
