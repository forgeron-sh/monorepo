import { ColumnChart } from "@forgeron/ui";

const days = [212, 198, 230, 241, 96, 88, 205, 260, 274, 151, 233, 245, 91, 84];
const label = (i: number) => `Nov ${i + 4}`;

// Events explain the dips: hover a flagged column and the readout says what happened.
export default function WithEvents() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <ColumnChart
        title="Automation runs per day"
        height={120}
        points={days.map((value, i) => ({ label: label(i), value }))}
        markers={[
          { at: "Nov 11", label: "Retry policy v2" },
          { at: "Nov 13", label: "Odoo outage, 2 h" },
        ]}
      />
    </div>
  );
}
