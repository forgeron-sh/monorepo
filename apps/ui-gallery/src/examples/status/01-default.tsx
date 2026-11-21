import { Status, StatusIndicator, StatusLabel } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      <Status tone="success">
        <StatusIndicator />
        <StatusLabel>Operational</StatusLabel>
      </Status>
      <Status tone="warning">
        <StatusIndicator />
        <StatusLabel>Degraded</StatusLabel>
      </Status>
      <Status tone="danger">
        <StatusIndicator />
        <StatusLabel>Down</StatusLabel>
      </Status>
      <Status tone="neutral">
        <StatusIndicator />
        <StatusLabel>Paused</StatusLabel>
      </Status>
    </div>
  );
}
