import { RecurrenceEditor } from "@forgeron/ui";

export default function Weekly() {
  return (
    <RecurrenceEditor
      start="2026-11-18"
      defaultValue={{
        frequency: "weekly",
        interval: 2,
        weekdays: [0, 2],
        end: { kind: "count", count: 6 },
      }}
    />
  );
}
