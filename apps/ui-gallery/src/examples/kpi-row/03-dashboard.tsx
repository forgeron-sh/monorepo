import { KpiRow } from "@forgeron/ui";

export default function Dashboard() {
  return (
    <div style={{ width: "100%" }}>
      <KpiRow
        items={[
          {
            label: "Revenue",
            value: "€48,210",
            delta: 0.124,
            hint: "vs last month",
            trend: [31, 33, 32, 36, 35, 39, 41, 40, 44, 48],
          },
          {
            label: "New leads",
            value: "212",
            delta: -0.06,
            hint: "vs last month",
            trend: [240, 236, 228, 231, 219, 224, 215, 212],
          },
          {
            label: "Win rate",
            value: "31.4%",
            delta: 0,
            hint: "vs last month",
          },
          {
            label: "Days to close",
            value: "18",
            delta: -0.14,
            better: "down",
            hint: "median",
            trend: [24, 23, 23, 21, 22, 20, 19, 18],
          },
        ]}
      />
    </div>
  );
}
