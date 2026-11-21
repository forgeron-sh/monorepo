import { ScheduleEditor } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 340 }}>
      <ScheduleEditor
        defaultValue="0 8 * * 1-5"
        timezone="Europe/Paris"
        modes={["hours", "daily", "weekly", "cron"]}
      />
    </div>
  );
}
