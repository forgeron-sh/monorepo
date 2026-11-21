import { Checkbox } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="terms" />
        <label htmlFor="terms">Accept the terms and conditions</label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="news" defaultChecked />
        <label htmlFor="news">Send me the newsletter</label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="locked" disabled />
        <label htmlFor="locked">Locked</label>
      </div>
    </div>
  );
}
