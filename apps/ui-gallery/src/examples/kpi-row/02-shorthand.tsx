import { KpiRow } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <KpiRow
        items={[
          {
            label: "Revenue",
            value: "€48.2k",
            delta: 0.124,
            trend: [31, 33, 32, 36, 35, 39, 41, 40, 44, 48],
          },
          {
            label: "Open tickets",
            value: "37",
            delta: 0.09,
            better: "down",
            trend: [30, 28, 31, 29, 33, 34, 32, 37],
          },
        ]}
      />
    </div>
  );
}
