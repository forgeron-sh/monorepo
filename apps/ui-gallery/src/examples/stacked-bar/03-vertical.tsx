import { StackedBar } from "@forgeron/ui";

export default function Vertical() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StackedBar
        title="Revenue by plan"
        orientation="vertical"
        format={(n) => `€${n}k`}
        series={[
          { key: "free", label: "Team" },
          { key: "pro", label: "Business" },
          { key: "ent", label: "Enterprise" },
        ]}
        items={[
          { label: "Aug", values: { free: 6, pro: 14, ent: 22 } },
          { label: "Sep", values: { free: 7, pro: 15, ent: 25 } },
          { label: "Oct", values: { free: 7, pro: 19, ent: 24 } },
          { label: "Nov", values: { free: 8, pro: 21, ent: 31 } },
        ]}
      />
    </div>
  );
}
