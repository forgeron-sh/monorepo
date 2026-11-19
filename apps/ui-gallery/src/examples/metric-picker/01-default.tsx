import { MetricPicker, dashboardEmptyQuery, type DashboardQuery } from "@forgeron/ui";
import { useState } from "react";

const measures = [
  { id: "revenue", label: "Revenue", hint: "deals", aggregations: ["sum", "avg", "max"] as const },
  { id: "deals", label: "Deals", hint: "deals", aggregations: ["count"] as const },
  {
    id: "tickets",
    label: "Tickets",
    hint: "support",
    aggregations: ["count", "distinct"] as const,
  },
];
const groupings = [
  { id: "created", label: "Created", kind: "time" as const },
  { id: "stage", label: "Stage" },
  { id: "owner", label: "Owner" },
];

export default function Default() {
  const [query, setQuery] = useState<DashboardQuery>({
    ...dashboardEmptyQuery,
    measure: "revenue",
    aggregation: "sum",
    groupBy: "created",
  });
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 560 }}
    >
      <MetricPicker
        measures={measures.map((m) => ({ ...m, aggregations: [...m.aggregations] }))}
        groupings={groupings}
        value={query}
        onChange={setQuery}
      />
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          font: "12px/18px var(--font-mono)",
          color: "var(--ink-muted)",
        }}
      >
        {JSON.stringify(query)}
      </pre>
    </div>
  );
}
