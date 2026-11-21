import { DivergingBar } from "@forgeron/ui";

const euros = (v: number) => `€${(v / 1000).toFixed(1)}k`;

// Spend against budget per department: over budget is bad news, so better is down.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <DivergingBar
        title="Budget gap, November"
        sides={["Under budget", "Over budget"]}
        better="down"
        format={euros}
        items={[
          { label: "Engineering", value: 4200 },
          { label: "Sales", value: -2600 },
          { label: "Support", value: 900 },
          { label: "Marketing", value: -6100 },
          { label: "Finance", value: -300 },
        ]}
      />
    </div>
  );
}
