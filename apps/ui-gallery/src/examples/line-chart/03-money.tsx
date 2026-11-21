import { LineChart } from "@forgeron/ui";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const revenue = [21400, 23800, 22100, 27600, 29900, 31200, 24800, 22300, 33900, 41700, 48210];
const euros = (v: number) => `€${(v / 1000).toFixed(1)}k`;

export default function Money() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <LineChart
        title="Revenue, 2026"
        height={120}
        format={euros}
        points={months.map((label, i) => ({ label, value: revenue[i]! }))}
      />
    </div>
  );
}
