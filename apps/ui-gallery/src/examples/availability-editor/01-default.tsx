// The zone and the week as parts, with no exceptions.
import {
  AvailabilityEditor,
  AvailabilityEditorWeek,
  AvailabilityEditorZone,
  defaultWeekly,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <AvailabilityEditor
      defaultValue={{ timezone: "Europe/Paris", weekly: defaultWeekly(), exceptions: [] }}
    >
      <AvailabilityEditorZone />
      <AvailabilityEditorWeek />
    </AvailabilityEditor>
  );
}
