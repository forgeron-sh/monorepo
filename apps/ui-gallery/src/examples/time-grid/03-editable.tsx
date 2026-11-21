// Drag empty space to create, drag an event to move it, its foot to resize it. Arrows move,
// Shift and arrows resize, Enter on a column creates.
import { TimeGrid, type TimeGridChange } from "@forgeron/ui";
import { useState } from "react";

interface Item {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
}

export default function Editable() {
  const [items, setItems] = useState<Item[]>([
    { id: "a", title: "Interview", date: "2026-11-18", start: "10:00", end: "11:00" },
    { id: "b", title: "Lunch", date: "2026-11-18", start: "12:30", end: "13:30" },
  ]);
  const update = (id: string, c: TimeGridChange) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...c } : i)));
  return (
    <div style={{ width: "100%", height: 420, display: "flex", border: "1px solid var(--line)" }}>
      <TimeGrid
        records={items}
        defaultView="day"
        date="2026-11-18"
        now="2026-11-18T10:07"
        scrollTo={8}
        onChange={update}
        onCreate={(c) =>
          setItems((list) => [...list, { id: String(list.length + 1), title: "New event", ...c }])
        }
      />
    </div>
  );
}
