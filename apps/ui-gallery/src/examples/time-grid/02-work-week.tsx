// A work week: overlapping events side by side, an all-day row, working hours, the now line.
import { TimeGrid } from "@forgeron/ui";

const events = [
  {
    id: "1",
    title: "Standup",
    date: "2026-11-18",
    start: "09:00",
    end: "09:30",
    color: "var(--accent)",
  },
  { id: "2", title: "Design review", date: "2026-11-18", start: "09:15", end: "10:30" },
  {
    id: "3",
    title: "Planning",
    date: "2026-11-19",
    start: "14:00",
    end: "15:30",
    color: "var(--success)",
  },
  { id: "4", title: "Offsite", date: "2026-11-20", start: "00:00", end: "24:00", allDay: true },
];
const hours = [1, 2, 3, 4, 5].map(() => [{ start: "09:00", end: "18:00" }]);

export default function WorkWeek() {
  return (
    <div style={{ width: "100%", height: 420, display: "flex", border: "1px solid var(--line)" }}>
      <TimeGrid
        records={events}
        date="2026-11-18"
        now="2026-11-18T10:07"
        scrollTo={8}
        workingHours={[...hours, [], []]}
      />
    </div>
  );
}
