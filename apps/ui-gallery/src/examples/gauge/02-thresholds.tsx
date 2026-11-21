// Lower is better here: the states are written for it.
import { Gauge } from "@forgeron/ui";

export default function Thresholds() {
  return (
    <Gauge
      title="First response, hours"
      value={5.5}
      target={4}
      min={0}
      max={12}
      format={(n) => `${n} h`}
      thresholds={[
        { at: 0, label: "Fast", tone: "good" },
        { at: 4, label: "Slow", tone: "warn" },
        { at: 8, label: "Late", tone: "bad" },
      ]}
    />
  );
}
