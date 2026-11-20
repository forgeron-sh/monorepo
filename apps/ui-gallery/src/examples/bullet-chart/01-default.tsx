import { BulletChart } from "@forgeron/ui";

// Each row against its target (the tick) and its bands: poor, fair, good.
export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <BulletChart
        title="Quarter, against targets"
        items={[
          {
            label: "Revenue",
            value: 212,
            target: 250,
            bands: [150, 225, 300],
            format: (v) => `€${v}k`,
          },
          { label: "New customers", value: 41, target: 36, bands: [20, 30, 50] },
          { label: "NPS", value: 38, target: 45, bands: [20, 40, 60] },
          {
            label: "Renewals",
            value: 91,
            target: 95,
            bands: [80, 90, 100],
            format: (v) => `${v}%`,
          },
        ]}
      />
    </div>
  );
}
