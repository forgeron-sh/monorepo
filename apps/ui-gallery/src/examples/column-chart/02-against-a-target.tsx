import { ColumnChart } from "@forgeron/ui";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const signed = [18, 22, 19, 27, 31, 24, 16, 14, 29, 36, 41];
const lastYear = [15, 17, 20, 21, 24, 22, 13, 12, 23, 27, 30];

// The dotted caps are last year; the rule is the monthly target.
export default function AgainstATarget() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ColumnChart
        title="Contracts signed, 2026"
        target={30}
        previous={lastYear}
        highlight="Nov"
        points={months.map((label, i) => ({ label, value: signed[i]! }))}
      />
    </div>
  );
}
