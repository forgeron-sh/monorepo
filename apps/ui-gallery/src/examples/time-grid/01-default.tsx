// The toolbar and the grid as parts: the title first, then the arrows, and the views on the right.
import {
  TimeGrid,
  TimeGridBody,
  TimeGridNext,
  TimeGridPrevious,
  TimeGridTitle,
  TimeGridToday,
  TimeGridToolbar,
  TimeGridViews,
} from "@forgeron/ui";

const meetings = [
  { id: "1", title: "Standup", date: "2026-11-18", start: "09:00", end: "09:30" },
  { id: "2", title: "Design review", date: "2026-11-18", start: "09:15", end: "10:30" },
  { id: "3", title: "Planning", date: "2026-11-19", start: "14:00", end: "15:30" },
  { id: "4", title: "Offsite", date: "2026-11-20", start: "00:00", end: "24:00", allDay: true },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", height: 420, display: "flex", border: "1px solid var(--line)" }}>
      <TimeGrid records={meetings} date="2026-11-18" now="2026-11-18T10:07" scrollTo={8}>
        <TimeGridToolbar>
          <TimeGridTitle />
          <TimeGridPrevious />
          <TimeGridToday />
          <TimeGridNext />
          <TimeGridViews views={["day", "workweek"]} />
        </TimeGridToolbar>
        <TimeGridBody />
      </TimeGrid>
    </div>
  );
}
