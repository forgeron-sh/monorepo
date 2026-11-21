// Leave and shifts per person; the two blocks of Ana that overlap are marked.
import { ResourceSchedule } from "@forgeron/ui";

const blocks = [
  {
    id: "1",
    name: "Leave",
    resource: "ana",
    start: "2026-11-16",
    end: "2026-11-20",
    color: "var(--success)",
  },
  {
    id: "2",
    name: "Training",
    resource: "ana",
    start: "2026-11-19",
    end: "2026-11-24",
    color: "var(--accent)",
  },
  {
    id: "3",
    name: "Night shifts",
    resource: "bob",
    start: "2026-11-18",
    end: "2026-11-22",
    color: "var(--warning)",
  },
];

export default function Leave() {
  return (
    <div style={{ width: "100%", height: 260, display: "flex", border: "1px solid var(--line)" }}>
      <ResourceSchedule
        resources={[
          { id: "ana", name: "Ana" },
          { id: "bob", name: "Bob" },
          { id: "cy", name: "Cy" },
        ]}
        blocks={blocks}
        today="2026-11-18"
        defaultZoom="weeks"
        labelWidth={160}
      />
    </div>
  );
}
