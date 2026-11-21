import { Progress } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 20, width: 320 }}>
      <Progress label="Uploading 4 files" value={62} showValue />
      <Progress label="Storage" value={9.1} max={10} showValue tone="danger" />
      <Progress label="Import done" value={100} showValue tone="success" />
    </div>
  );
}
