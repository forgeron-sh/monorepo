import { Led } from "@forgeron/ui";

export default function Tones() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Led tone="success" /> Running
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Led tone="warning" /> Building
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Led tone="danger" /> Stopped
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Led tone="accent" /> Selected
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Led /> Idle
      </span>
    </div>
  );
}
