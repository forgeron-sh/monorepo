import { Switch } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid" }}>
      <Switch label="Email me when a deploy fails" defaultChecked />
      <Switch label="Weekly digest" />
      <Switch label="Managed by your admin" disabled />
    </div>
  );
}
