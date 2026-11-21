import {
  ChartContainer,
  ChartTooltip,
  Donut,
  DonutCenter,
  DonutKey,
  DonutRing,
  type ChartConfig,
} from "@forgeron/ui";

const chartConfig = {
  chrome: { label: "Chrome" },
  safari: { label: "Safari" },
  firefox: { label: "Firefox" },
  other: { label: "Other" },
} satisfies ChartConfig;

const chartData = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "other", visitors: 90 },
];

export default function Parts() {
  return (
    <ChartContainer config={chartConfig}>
      <Donut title="Visitors by browser" data={chartData} dataKey="visitors" nameKey="browser">
        <DonutKey hideShare />
        <DonutRing size={120} thickness={8}>
          <DonutCenter label="Visitors" />
        </DonutRing>
      </Donut>
      <ChartTooltip />
    </ChartContainer>
  );
}
