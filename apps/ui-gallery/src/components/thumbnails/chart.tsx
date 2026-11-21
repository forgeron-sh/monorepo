import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from "@forgeron/ui";

/** A still picture of the tooltip and the legend, which only show on hover in the real chart. */
const config = {
  views: { label: "Views", color: "var(--accent)" },
  visits: { label: "Visits", color: "var(--ink-muted)" },
} satisfies ChartConfig;

export default function ChartThumbnail() {
  return (
    <ChartContainer config={config} style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <ChartTooltipContent
        label="Nov 12"
        payload={[
          { dataKey: "views", value: 1204 },
          { dataKey: "visits", value: 388 },
        ]}
      />
      <ChartLegendContent />
    </ChartContainer>
  );
}
