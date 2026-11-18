import {
  Clock01Icon,
  Database01Icon,
  GlobeIcon,
  Message01Icon,
  RefreshIcon,
} from "@forgeron/icons";
import { Button, Icon, RunDetail } from "@forgeron/ui";

export default function AFailedRun() {
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <RunDetail
        run={{
          id: "1211",
          status: "error",
          at: "2026-11-18 09:15:02",
          durationMs: 1840,
          trigger: { label: "Schedule · Weekdays at 09:15", icon: Clock01Icon },
        }}
        actions={
          <Button size="sm" variant="ghost">
            <Icon icon={RefreshIcon} size={12} variant="mono" />
            Replay
          </Button>
        }
        onRetry={() => {}}
        steps={[
          {
            id: "t",
            name: "Schedule",
            icon: Clock01Icon,
            status: "success",
            startMs: 0,
            durationMs: 3,
            items: 1,
            output: { firedAt: "2026-11-18T09:15:00+01:00" },
          },
          {
            id: "q",
            name: "Open orders",
            icon: Database01Icon,
            status: "success",
            startMs: 3,
            durationMs: 212,
            items: 14,
            input: { firedAt: "2026-11-18T09:15:00+01:00" },
            output: [
              { order: "SO-4418", weight: 212, to: "Grenoble" },
              { order: "SO-4419", weight: 18, to: "Lyon" },
            ],
          },
          {
            id: "h",
            name: "Fetch carrier rates",
            icon: GlobeIcon,
            status: "error",
            startMs: 215,
            durationMs: 1620,
            attempts: 3,
            input: { order: "SO-4418", weight: 212, to: "Grenoble" },
            error: {
              code: "UPSTREAM_503",
              message: "Geodis answered 503 Service Unavailable three times.",
              log: [
                "09:15:02.21 GET /v2/rates → 503 (412 ms)",
                "09:15:02.83 retry 2 → 503 (398 ms)",
                "09:15:03.84 retry 3 → 503 (402 ms)",
              ],
            },
          },
          { id: "c", name: "Post the cheapest", icon: Message01Icon, status: "skipped" },
        ]}
      />
    </div>
  );
}
