import { BulletChart } from "@forgeron/ui";

const hours = (v: number) => `${v} h`;

// Without bands: a bar and its target, where less is better is still read by the share.
export default function NoBands() {
  return (
    <div style={{ width: 420 }}>
      <BulletChart
        title="Hours logged this week"
        format={hours}
        items={[
          { label: "Amélie", value: 36, target: 35 },
          { label: "Bastien", value: 28, target: 35 },
          { label: "Chloé", value: 31, target: 35 },
        ]}
      />
    </div>
  );
}
