// The toolbar as parts (the title next to the arrows) over the grid of days.
import {
  CalendarView,
  CalendarViewBody,
  CalendarViewNext,
  CalendarViewPrevious,
  CalendarViewTitle,
  CalendarViewToday,
  CalendarViewToolbar,
} from "@forgeron/ui";

const records = [
  { id: "OPS-38", title: "Signage audit", due: "2026-11-18", color: "var(--warning)" },
  { id: "OPS-37", title: "Carrier rates", due: "2026-11-18", color: "var(--accent)" },
  { id: "OPS-41", title: "Dock schedule", due: "2026-11-20" },
  { id: "OPS-35", title: "Safety walk", due: "2026-11-26", color: "var(--warning)" },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 720, border: "1px solid var(--line)" }}>
      <CalendarView records={records} today="2026-11-18">
        <CalendarViewToolbar>
          <CalendarViewTitle />
          <CalendarViewPrevious />
          <CalendarViewToday />
          <CalendarViewNext />
        </CalendarViewToolbar>
        <CalendarViewBody maxPerDay={2} />
      </CalendarView>
    </div>
  );
}
