import { ColumnChart } from "@forgeron/ui";

const weeks = [31, 28, 35, 41, 38, 44, 52, 47, 55, 61, 58, 64];

export default function Default() {
  return (
    <div style={{ width: 360 }}>
      <ColumnChart
        title="Deploys per week"
        height={120}
        highlight="W46"
        points={weeks.map((value, i) => ({ label: `W${35 + i}`, value }))}
      />
    </div>
  );
}
