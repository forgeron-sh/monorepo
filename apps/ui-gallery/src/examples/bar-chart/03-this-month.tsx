import { BarChart } from "@forgeron/ui";

// The current month stands out; the others give it a scale.
export default function ThisMonth() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <BarChart
        title="Expenses approved"
        highlight="November"
        format={(v) => `${v} reports`}
        data={[
          { label: "August", value: 41 },
          { label: "September", value: 63 },
          { label: "October", value: 58 },
          { label: "November", value: 72 },
        ]}
      />
    </div>
  );
}
