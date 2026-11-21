import { LineChart } from "@forgeron/ui";

const weeks = [12, 14, 13, 17, 16, 21, 19, 24, 26, 25, 29, 33];

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <LineChart
        title="Signups"
        height={96}
        points={weeks.map((value, i) => ({ label: `W${35 + i}`, value }))}
      />
    </div>
  );
}
