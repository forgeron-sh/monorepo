// One week with every record of each day, the week number beside the title.
import { CalendarView } from "@forgeron/ui";

const shifts = [
  { id: "1", name: "Inbound, Hugo", date: "2026-11-16", color: "var(--accent)" },
  { id: "2", name: "Inbound, Nadia", date: "2026-11-17", color: "var(--accent)" },
  { id: "3", name: "Inventory count", date: "2026-11-18", color: "var(--warning)" },
  { id: "4", name: "Inbound, Camille", date: "2026-11-18", color: "var(--accent)" },
  { id: "5", name: "Carrier visit", date: "2026-11-18" },
  { id: "6", name: "Fire drill", date: "2026-11-19", color: "var(--danger)" },
  { id: "7", name: "Inbound, Tom", date: "2026-11-20", color: "var(--accent)" },
  { id: "8", name: "Saturday pickup", date: "2026-11-21" },
];

export default function Week() {
  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <CalendarView records={shifts} today="2026-11-18" defaultMode="week" />
    </div>
  );
}
