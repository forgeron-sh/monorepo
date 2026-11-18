import { BarChart } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <BarChart
        title="Tickets by team"
        highlight="Support"
        data={[
          { label: "Support", value: 48 },
          { label: "Billing", value: 31 },
          { label: "Logistics", value: 22 },
          { label: "IT", value: 9 },
        ]}
      />
    </div>
  );
}
