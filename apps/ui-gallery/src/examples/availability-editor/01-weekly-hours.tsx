import { AvailabilityEditor, defaultWeekly } from "@forgeron/ui";

export default function WeeklyHours() {
  return (
    <AvailabilityEditor
      today="2026-11-18"
      defaultValue={{
        timezone: "Europe/Paris",
        weekly: defaultWeekly().map((d, i) =>
          i === 2
            ? [
                { start: "09:00", end: "12:00" },
                { start: "14:00", end: "18:00" },
              ]
            : d,
        ),
        exceptions: [
          { date: "2026-12-24", kind: "off", spans: [] },
          { date: "2026-12-31", kind: "hours", spans: [{ start: "09:00", end: "13:00" }] },
        ],
      }}
    />
  );
}
