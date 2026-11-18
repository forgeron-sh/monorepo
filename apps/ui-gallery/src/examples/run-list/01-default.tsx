import { Clock01Icon, PlayIcon } from "@forgeron/icons";
import { RunList } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 300 }}>
      <RunList
        density="compact"
        today="2026-11-18"
        selected="1206"
        onSelect={() => {}}
        runs={[
          {
            id: "1206",
            status: "running",
            at: "2026-11-18 10:42:07",
            trigger: { label: "Manual", icon: PlayIcon },
          },
          {
            id: "1205",
            status: "error",
            at: "2026-11-18 08:00:00",
            durationMs: 1840,
            trigger: { label: "Schedule", icon: Clock01Icon },
          },
          {
            id: "1204",
            status: "success",
            at: "2026-11-17 08:00:00",
            durationMs: 612,
            trigger: { label: "Schedule", icon: Clock01Icon },
          },
        ]}
      />
    </div>
  );
}
