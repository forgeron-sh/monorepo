import { Histogram } from "@forgeron/ui";

const deals = [
  2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9, 10, 11, 12, 12, 14, 15, 18, 22, 25, 31, 40,
  48,
];

// Deal sizes in k€, the median and the top decile.
export default function DealSizes() {
  return (
    <div style={{ width: 420 }}>
      <Histogram
        title="Deal size, 2026"
        values={deals}
        bins={10}
        min={0}
        unit="deals"
        format={(v) => `€${v}k`}
        marks={[
          { p: 0.5, label: "median" },
          { p: 0.9, label: "p90" },
        ]}
        height={100}
      />
    </div>
  );
}
