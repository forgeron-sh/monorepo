import { Switch } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Switch id="airplane-mode" />
      <label htmlFor="airplane-mode">Airplane mode</label>
    </div>
  );
}
