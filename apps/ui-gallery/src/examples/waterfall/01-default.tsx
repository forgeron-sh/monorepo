import { Waterfall } from "@forgeron/ui";

const euros = (v: number) => `€${(v / 1000).toFixed(1)}k`;

// How October's recurring revenue became November's.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Waterfall
        title="MRR, October to November"
        format={euros}
        start={{ label: "Oct", value: 48200 }}
        steps={[
          { label: "New", value: 6400 },
          { label: "Upsell", value: 2100 },
          { label: "Downgrade", value: -1300 },
          { label: "Churn", value: -3900 },
        ]}
        end="Nov"
      />
    </div>
  );
}
