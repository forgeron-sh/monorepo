// A month beside the times; the viewer reads them in their own zone.
import { SlotPicker, defaultWeekly } from "@forgeron/ui";

export default function CalendarAndZone() {
  return (
    <SlotPicker
      layout="calendar"
      availability={{ timezone: "Europe/Paris", weekly: defaultWeekly(), exceptions: [] }}
      duration={60}
      defaultDate="2026-11-18"
      defaultTimezone="America/New_York"
      now="2026-11-18T04:00"
    />
  );
}
