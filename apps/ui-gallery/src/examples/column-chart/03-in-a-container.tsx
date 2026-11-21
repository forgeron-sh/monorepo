import { ChartContainer, ChartTooltip, ColumnChart, type ChartConfig } from "@forgeron/ui";

const chartConfig = {
  runs: { label: "Runs", color: "var(--ink)" },
} satisfies ChartConfig;

const hours = [4, 2, 1, 0, 1, 3, 9, 22, 41, 38, 35, 29, 33, 36, 31, 27, 24, 18, 12, 9, 7, 6, 5, 4];

export default function InAContainer() {
  return (
    <ChartContainer config={chartConfig} style={{ width: "100%", maxWidth: 520 }}>
      <ColumnChart
        title="Automation runs, today"
        dataKey="runs"
        height={100}
        points={hours.map((value, h) => ({ label: `${String(h).padStart(2, "0")}:00`, value }))}
      />
      <ChartTooltip />
    </ChartContainer>
  );
}
