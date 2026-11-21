import { ChartContainer, ChartTooltip, LineChart, type ChartConfig } from "@forgeron/ui";

const chartConfig = {
  signups: { label: "Signups", color: "var(--accent)" },
} satisfies ChartConfig;

export default function InAContainer() {
  return (
    <ChartContainer config={chartConfig} style={{ width: 320 }}>
      <LineChart
        title="Signups"
        height={96}
        dataKey="signups"
        points={[12, 14, 13, 17, 16, 21].map((value, i) => ({ label: `W${35 + i}`, value }))}
      />
      <ChartTooltip />
    </ChartContainer>
  );
}
