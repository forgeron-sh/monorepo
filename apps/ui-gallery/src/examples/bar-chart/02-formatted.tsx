import { BarChart } from "@forgeron/ui";

const euros = (v: number) => `€${v.toLocaleString("en")}`;

export default function Formatted() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <BarChart
        title="Pipeline by stage"
        format={euros}
        data={[
          { label: "New", value: 128400 },
          { label: "Qualified", value: 96200 },
          { label: "Proposal", value: 61800 },
          { label: "Negotiation", value: 34500 },
          { label: "Won", value: 18900 },
        ]}
      />
    </div>
  );
}
