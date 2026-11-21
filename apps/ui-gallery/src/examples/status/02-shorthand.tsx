import { Status } from "@forgeron/ui";

export default function Shorthand() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      <Status tone="success" label="Operational" />
      <Status tone="warning" label="Degraded" />
      <Status tone="danger" label="Down" />
      <Status tone="neutral" label="Paused" />
    </div>
  );
}
