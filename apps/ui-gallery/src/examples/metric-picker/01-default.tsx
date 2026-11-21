import {
  MetricPicker,
  MetricPickerGrouping,
  MetricPickerMeasure,
  MetricPickerSteps,
  MetricPickerSummary,
} from "@forgeron/ui";

// Two steps and the sentence: no filter step, so the root gets no `fields`.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <MetricPicker
        measures={[
          { id: "revenue", label: "Revenue", hint: "deals", aggregations: ["sum", "avg"] },
          { id: "deals", label: "Deals", hint: "deals", aggregations: ["count"] },
        ]}
        groupings={[
          { id: "created", label: "Created", kind: "time" },
          { id: "owner", label: "Owner" },
        ]}
        defaultValue={{
          measure: "revenue",
          aggregation: "sum",
          groupBy: "created",
          interval: "month",
          filters: [],
        }}
      >
        <MetricPickerSteps>
          <MetricPickerMeasure />
          <MetricPickerGrouping />
        </MetricPickerSteps>
        <MetricPickerSummary />
      </MetricPicker>
    </div>
  );
}
