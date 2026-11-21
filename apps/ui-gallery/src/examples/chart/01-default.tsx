import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  LineChart,
  type ChartConfig,
} from "@forgeron/ui";

const chartConfig = {
  signups: { label: "Signups", color: "var(--accent)" },
} satisfies ChartConfig;

const weeks = [12, 14, 13, 17, 16, 21, 19, 24, 26, 25, 29, 33];

export default function Default() {
  return (
    <ChartContainer config={chartConfig} style={{ width: 360 }}>
      <LineChart
        title="Signups"
        height={120}
        dataKey="signups"
        points={weeks.map((value, i) => ({ label: `W${35 + i}`, value }))}
      />
      <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
      <ChartLegend content={<ChartLegendContent />} />
    </ChartContainer>
  );
}
