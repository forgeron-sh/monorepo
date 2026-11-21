import {
  BarChart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@forgeron/ui";

const chartConfig = {
  tickets: { label: "Tickets", color: "var(--success)" },
} satisfies ChartConfig;

export default function Bars() {
  return (
    <ChartContainer config={chartConfig} style={{ width: 360 }}>
      <BarChart
        title="Tickets by team"
        dataKey="tickets"
        data={[
          { label: "Support", value: 42 },
          { label: "Billing", value: 18 },
          { label: "Sales", value: 9 },
        ]}
      />
      <ChartTooltip content={<ChartTooltipContent indicator="dashed" hideLabel />} />
    </ChartContainer>
  );
}
