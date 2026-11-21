// The toolbar and the scrolling region as parts; the region could take its own axis and rows.
import { Timeline, TimelineScroller, TimelineToolbar } from "@forgeron/ui";

const projects = [
  {
    id: "lyon",
    name: "Lyon depot",
    color: "var(--accent)",
    start: "2026-10-12",
    end: "2027-01-15",
  },
  { id: "q4", name: "Q4 closing", color: "var(--success)", start: "2026-11-02", end: "2026-12-31" },
  { id: "audit", name: "Safety audit", end: "2026-12-10" },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", height: 230, display: "flex", border: "1px solid var(--line)" }}>
      <Timeline records={projects} today="2026-11-18" labelWidth={120} defaultZoom="months">
        <TimelineToolbar />
        <TimelineScroller />
      </Timeline>
    </div>
  );
}
