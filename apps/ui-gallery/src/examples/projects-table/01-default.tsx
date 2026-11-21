// Composed from parts: the header names the columns, each row is a name and the cells you pick.
// The parts read the order, the editing and the menus from the table.
import {
  ProjectsTable,
  ProjectsTableBody,
  ProjectsTableCell,
  ProjectsTableHead,
  ProjectsTableHeader,
  ProjectsTableName,
  ProjectsTableRow,
  type ProjectItem,
} from "@forgeron/ui";

const projects: ProjectItem[] = [
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
];

export default function Composed() {
  return (
    <div style={{ width: 460 }}>
      <ProjectsTable projects={projects} sortable>
        <ProjectsTableHeader>
          <ProjectsTableHead column="name" />
          <ProjectsTableHead column="progress" />
          <ProjectsTableHead column="status" />
        </ProjectsTableHeader>
        <ProjectsTableBody>
          {projects.map((project) => (
            <ProjectsTableRow key={project.id} project={project}>
              <ProjectsTableName project={project} />
              <ProjectsTableCell project={project} column="progress" />
              <ProjectsTableCell project={project} column="status" />
            </ProjectsTableRow>
          ))}
        </ProjectsTableBody>
      </ProjectsTable>
    </div>
  );
}
