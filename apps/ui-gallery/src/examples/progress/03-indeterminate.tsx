import { Progress } from "@forgeron/ui";

export default function Indeterminate() {
  return (
    <div style={{ width: 320 }}>
      <Progress label="Syncing with Odoo" />
    </div>
  );
}
