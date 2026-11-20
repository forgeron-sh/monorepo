import {
  ChartContainer,
  ChartTooltip,
  StackedBar,
  StackedBarBars,
  StackedBarKey,
  type ChartConfig,
} from "@forgeron/ui";

const chartConfig = {
  new: { label: "New" },
  open: { label: "Open" },
  closed: { label: "Closed" },
} satisfies ChartConfig;

export default function Parts() {
  return (
    <ChartContainer config={chartConfig}>
      <StackedBar
        title="Tickets by team"
        items={[
          { label: "Support", values: { new: 12, open: 30, closed: 58 } },
          { label: "Billing", values: { new: 4, open: 11, closed: 27 } },
          { label: "Onboarding", values: { new: 9, open: 6, closed: 15 } },
        ]}
      >
        <StackedBarBars />
        <StackedBarKey />
      </StackedBar>
      <ChartTooltip />
    </ChartContainer>
  );
}
