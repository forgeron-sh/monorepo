import { ScheduleEditor } from "@forgeron/ui";

// What no plain shape says stays cron, still said in words when it can be.
export default function Cron() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ScheduleEditor defaultValue="0 9,17 * * *" timezone="UTC" from="2026-11-18T10:00" />
    </div>
  );
}
