// The timeline's toolbar and body, then the list of the blocks that clash.
import {
  ResourceSchedule,
  ResourceScheduleBody,
  ResourceScheduleConflicts,
  ResourceScheduleToolbar,
} from "@forgeron/ui";

const blocks = [
  { id: "1", name: "Leave", resource: "ana", start: "2026-11-16", end: "2026-11-20" },
  { id: "2", name: "Training", resource: "ana", start: "2026-11-19", end: "2026-11-24" },
  { id: "3", name: "Night shifts", resource: "bob", start: "2026-11-18", end: "2026-11-22" },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", border: "1px solid var(--line)" }}>
      <ResourceSchedule
        resources={[
          { id: "ana", name: "Ana" },
          { id: "bob", name: "Bob" },
        ]}
        blocks={blocks}
        today="2026-11-18"
        defaultZoom="weeks"
        labelWidth={160}
      >
        <ResourceScheduleToolbar />
        <div style={{ height: 200, display: "flex" }}>
          <ResourceScheduleBody />
        </div>
        <ResourceScheduleConflicts />
      </ResourceSchedule>
    </div>
  );
}
