import { Waffle } from "@forgeron/ui";

const euros = (v: number) => `€${(v / 1000).toFixed(0)}k`;

// The slice that matters in ember; the others share the greys, each with its own pattern.
export default function Highlight() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <Waffle
        title="Spend by category"
        format={euros}
        highlight="Cloud"
        cell={12}
        items={[
          { label: "Salaries", value: 61000 },
          { label: "Cloud", value: 18000 },
          { label: "Software", value: 9000 },
          { label: "Travel", value: 4000 },
          { label: "Other", value: 2500 },
        ]}
      />
    </div>
  );
}
