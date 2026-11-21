import {
  ScheduleEditor,
  ScheduleEditorControls,
  ScheduleEditorModes,
  ScheduleEditorNext,
  ScheduleEditorSummary,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [cron, setCron] = useState("0 8 * * 1-5");
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ScheduleEditor
        value={cron}
        onChange={setCron}
        timezone="Europe/Paris"
        from="2026-11-18T10:00"
        modes={["daily", "weekly", "cron"]}
      >
        <ScheduleEditorModes />
        <ScheduleEditorControls />
        <ScheduleEditorSummary />
        <ScheduleEditorNext />
      </ScheduleEditor>
    </div>
  );
}
