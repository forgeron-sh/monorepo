import { ApiIcon, Clock01Icon, PlayIcon, RefreshIcon, TrophyIcon } from "@forgeron/icons";
import { RunList, type RunSummary } from "@forgeron/ui";
import { useState } from "react";

const runs: RunSummary[] = [
  {
    id: "1212",
    status: "success",
    at: "2026-11-18 10:42:07",
    durationMs: 284,
    automation: "Won deal → invoice",
    trigger: { label: "Event", icon: TrophyIcon },
    detail: "6 steps ran",
  },
  {
    id: "1211",
    status: "error",
    at: "2026-11-18 09:15:02",
    durationMs: 1840,
    automation: "Carrier rates",
    trigger: { label: "Schedule", icon: Clock01Icon },
    detail: "Fetch rates: Geodis answered 503",
  },
  {
    id: "1210",
    status: "success",
    at: "2026-11-18 09:16:40",
    durationMs: 920,
    automation: "Carrier rates",
    trigger: { label: "Retry of #1211", icon: RefreshIcon },
    detail: "Reused 2 steps",
  },
  {
    id: "1209",
    status: "cancelled",
    at: "2026-11-17 18:03:11",
    durationMs: 30000,
    automation: "Partner sync",
    trigger: { label: "Webhook", icon: ApiIcon },
    detail: "Stopped after 30 s",
  },
  {
    id: "1208",
    status: "success",
    at: "2026-11-17 16:20:54",
    durationMs: 75_400,
    automation: "Month-end report",
    trigger: { label: "Manual · Camille", icon: PlayIcon },
    detail: "4 steps ran",
  },
];

export default function AcrossAutomations() {
  const [selected, setSelected] = useState("1211");
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <RunList runs={runs} today="2026-11-18" filter selected={selected} onSelect={setSelected} />
    </div>
  );
}
