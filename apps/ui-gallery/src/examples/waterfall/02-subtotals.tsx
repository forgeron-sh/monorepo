import { Waterfall } from "@forgeron/ui";

const k = (v: number) => `${Math.round(v / 1000)}k`;

// A profit and loss bridge: Gross margin is a subtotal; costs going down are good news here.
export default function Subtotals() {
  return (
    <div style={{ width: "100%", maxWidth: 620 }}>
      <Waterfall
        title="Quarter, revenue to profit"
        format={k}
        height={220}
        start={{ label: "Revenue", value: 412000 }}
        steps={[
          { label: "Hosting", value: -48000 },
          { label: "Support", value: -61000 },
          { label: "Gross margin", value: 0 },
          { label: "Salaries", value: -198000 },
          { label: "Tools", value: -22000 },
          { label: "Grants", value: 15000 },
        ]}
        totals={["Gross margin"]}
        end="Profit"
      />
    </div>
  );
}
