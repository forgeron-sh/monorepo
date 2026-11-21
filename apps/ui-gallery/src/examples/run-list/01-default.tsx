import { Clock01Icon } from "@forgeron/icons";
import { RunList, RunListDays, RunListFilter } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [selected, setSelected] = useState<string | null>("1205");
  return (
    <div style={{ width: 520 }}>
      <RunList
        filter
        today="2026-11-18"
        selected={selected}
        onSelect={setSelected}
        runs={[
          {
            id: "1205",
            status: "error",
            at: "2026-11-18 08:00:00",
            durationMs: 1840,
            detail: "Send invoice: 503 from upstream",
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
      >
        <RunListFilter />
        <RunListDays />
      </RunList>
    </div>
  );
}
