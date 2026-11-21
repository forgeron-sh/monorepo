import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  StackedBar,
  type ChartConfig,
} from "@forgeron/ui";

// No colour in the config: the defaults apply, ember first, then the ink tones. StackedBar draws
// its own key (with each series' pattern), so no ChartLegend here.
const chartConfig = {
  open: { label: "Open" },
  waiting: { label: "Waiting" },
  done: { label: "Done" },
} satisfies ChartConfig;

export default function Series() {
  return (
    <ChartContainer config={chartConfig} style={{ width: 420 }}>
      <StackedBar
        title="Tickets by week"
        series={[
          { key: "open", label: "Open" },
          { key: "waiting", label: "Waiting" },
          { key: "done", label: "Done" },
        ]}
        items={[
          { label: "W44", values: { open: 8, waiting: 3, done: 21 } },
          { label: "W45", values: { open: 5, waiting: 6, done: 26 } },
        ]}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
    </ChartContainer>
  );
}
