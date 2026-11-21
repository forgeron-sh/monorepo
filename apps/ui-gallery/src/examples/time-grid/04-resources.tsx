// The columns of a day are resources: chairs, rooms, people.
import { TimeGrid } from "@forgeron/ui";

const events = [
  { id: "1", title: "Cut", date: "2026-11-18", start: "09:00", end: "10:00", resource: "ana" },
  { id: "2", title: "Colour", date: "2026-11-18", start: "09:30", end: "12:00", resource: "bob" },
  { id: "3", title: "Cut", date: "2026-11-18", start: "14:00", end: "14:45", resource: "ana" },
];

export default function Resources() {
  return (
    <div style={{ width: "100%", height: 380, display: "flex", border: "1px solid var(--line)" }}>
      <TimeGrid
        records={events}
        date="2026-11-18"
        now="2026-11-18T10:07"
        scrollTo={8}
        hours={[8, 19]}
        resources={[
          { id: "ana", name: "Ana", color: "var(--accent)" },
          { id: "bob", name: "Bob", color: "var(--success)" },
        ]}
      />
    </div>
  );
}
