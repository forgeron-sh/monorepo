import { Clock01Icon, MoreHorizontalIcon, Ticket01Icon } from "@forgeron/icons";
import { AutomationList, IconButton, RunBars, Switch, type AutomationSummary } from "@forgeron/ui";
import { useState } from "react";

const start: AutomationSummary[] = [
  {
    id: "triage",
    name: "Triage new tickets",
    meta: "Support · 5 steps · v2",
    trigger: { label: "Helpdesk · Ticket created", icon: Ticket01Icon },
    state: "active",
    lastRun: { status: "success", ago: "just now", durationMs: 140 },
    runs: [12, 9, 14, 3, 2, 11, 16, 13, 10, 15, 4, 1, 12, 14],
    errors: [0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    owner: "Nadia Petit",
  },
  {
    id: "report",
    name: "Month-end report",
    meta: "Finance · 4 steps · v1",
    trigger: { label: "Monthly on the 1st at 06:00", icon: Clock01Icon },
    state: "paused",
    lastRun: { status: "success", ago: "17 days ago", durationMs: 75_400 },
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    owner: "Tom Garnier",
  },
];

// The end of each row is the screen's: here the active switch and a menu. RunBars also stands alone.
export default function WithActions() {
  const [rows, setRows] = useState(start);
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 980 }}>
      <AutomationList
        automations={rows}
        onOpen={() => {}}
        renderActions={(a) => (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Switch
              label={<span className="fg-sr">Active</span>}
              checked={a.state === "active"}
              onChange={(e) =>
                setRows(
                  rows.map((r) =>
                    r.id === a.id ? { ...r, state: e.target.checked ? "active" : "paused" } : r,
                  ),
                )
              }
            />
            <IconButton icon={MoreHorizontalIcon} label={`Actions of ${a.name}`} size="sm" />
          </span>
        )}
      />
      <RunBars
        values={[12, 9, 14, 3, 2, 11, 16]}
        errors={[0, 1, 0, 0, 0, 0, 2]}
        width={140}
        height={32}
        label="Runs, last 7 days"
      />
    </div>
  );
}
