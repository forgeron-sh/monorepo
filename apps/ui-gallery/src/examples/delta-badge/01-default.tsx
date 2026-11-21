import { DeltaBadge } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DeltaBadge value="€48.2k" delta={0.124} hint="vs last month" />
      <DeltaBadge value="37" delta={0.09} better="down" hint="open tickets" />
      <DeltaBadge value="18 days" delta={-0.14} better="down" />
      <DeltaBadge value="31.4%" delta={0} />
      <DeltaBadge value="New" delta={null} />
    </div>
  );
}
