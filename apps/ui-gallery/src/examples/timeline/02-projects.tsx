import { Timeline } from "@forgeron/ui";

const projects = [
  {
    id: "lyon",
    name: "Lyon depot",
    color: "var(--accent)",
    start: "2026-10-12",
    end: "2027-01-15",
    milestones: [
      { id: "lease", label: "Lease signed", date: "2026-10-15", done: true },
      { id: "racks", label: "Dock and racks", date: "2026-12-05" },
    ],
  },
  {
    id: "q4",
    name: "Q4 closing",
    color: "var(--success)",
    start: "2026-11-02",
    end: "2026-12-31",
    milestones: [{ id: "pack", label: "Auditor pack", date: "2026-12-15" }],
  },
  {
    id: "rates",
    name: "Carrier rates",
    color: "var(--warning)",
    start: "2026-11-16",
    end: "2026-12-04",
  },
  { id: "audit", name: "Safety audit", end: "2026-12-10" },
];

export default function Projects() {
  return (
    <div style={{ width: "100%", height: 230, display: "flex", border: "1px solid var(--line)" }}>
      <Timeline records={projects} today="2026-11-18" toolbar={false} labelWidth={120} />
    </div>
  );
}
