import { ScheduleEditor } from "@forgeron/ui";
import { useState } from "react";

// `from` is now in the schedule's timezone, passed by the screen: the block never reads the clock.
export default function NextRunsAndTimezone() {
  const [cron, setCron] = useState("30 7 * * 1,3,5");
  const [tz, setTz] = useState("Europe/Paris");
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 520 }}>
      <ScheduleEditor
        value={cron}
        onChange={setCron}
        timezone={tz}
        timezones={["Europe/Paris", "Europe/London", "UTC", "America/New_York"]}
        onTimezoneChange={setTz}
        from="2026-11-18T10:00"
        preview={4}
      />
    </div>
  );
}
