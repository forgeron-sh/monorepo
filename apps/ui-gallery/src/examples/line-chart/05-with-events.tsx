import { LineChart } from "@forgeron/ui";

const weeks = [12, 14, 13, 17, 16, 21, 19, 24, 26, 25, 29, 33];

// What explains a step, next to it: a numbered flag on the point, the key under the axis.
export default function WithEvents() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <LineChart
        title="Signups"
        height={120}
        points={weeks.map((value, i) => ({ label: `W${35 + i}`, value }))}
        markers={[
          { at: "W40", label: "Pricing page live" },
          { at: "W42", label: "Newsletter" },
          { at: "W46", label: "v2 launch" },
        ]}
      />
    </div>
  );
}
