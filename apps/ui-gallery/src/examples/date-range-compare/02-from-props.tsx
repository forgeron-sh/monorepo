import { DateRangeCompare, dashboardCompareRanges, type DashboardPeriod } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [period, setPeriod] = useState<DashboardPeriod>({
    range: { from: "2026-11-01", to: "2026-11-30" },
    compare: "previous-period",
  });
  const { current, previous } = dashboardCompareRanges(period);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DateRangeCompare today="2026-11-18" value={period} onChange={setPeriod} />
      <pre style={{ margin: 0, font: "12px/18px var(--font-mono)", color: "var(--ink-muted)" }}>
        {JSON.stringify({ current, previous }, null, 2)}
      </pre>
    </div>
  );
}
