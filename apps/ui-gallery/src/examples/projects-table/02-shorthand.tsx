import { ProjectsTable } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <ProjectsTable
        columns={["progress"]}
        projects={[
          {
            id: "lyon",
            name: "Lyon depot",
            color: "var(--accent)",
            status: "started",
            issues: 12,
            done: 5,
            started: 4,
          },
          {
            id: "carriers",
            name: "Carrier rates",
            color: "var(--warning)",
            status: "started",
            issues: 6,
            done: 4,
            started: 1,
          },
          {
            id: "q4",
            name: "Year-end closing",
            color: "var(--success)",
            status: "planned",
            issues: 8,
            done: 0,
          },
        ]}
      />
    </div>
  );
}
