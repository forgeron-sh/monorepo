import { KpiRow, KpiRowItem } from "@forgeron/ui";

export default function Items() {
  return (
    <KpiRow>
      <KpiRowItem
        label="Revenue"
        value="€48.2k"
        delta={0.12}
        hint="vs last month"
        trend={[31, 34, 33, 39, 42, 48]}
      />
      <KpiRowItem label="Open tickets" value="37" delta={-0.08} better="down" hint="vs last week">
        <a href="#tickets">See the queue</a>
      </KpiRowItem>
      <KpiRowItem label="Uptime" value="99.94%" />
    </KpiRow>
  );
}
