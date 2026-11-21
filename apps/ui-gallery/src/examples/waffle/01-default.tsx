import {
  ChartContainer,
  ChartTooltip,
  Waffle,
  WaffleGrid,
  WaffleKey,
  WaffleNote,
  type ChartConfig,
} from "@forgeron/ui";

const chartConfig = {
  paid: { label: "Paid" },
  trial: { label: "Trial" },
  free: { label: "Free" },
} satisfies ChartConfig;

const chartData = [
  { plan: "paid", accounts: 312 },
  { plan: "trial", accounts: 96 },
  { plan: "free", accounts: 540 },
];

export default function Parts() {
  return (
    <ChartContainer config={chartConfig}>
      <Waffle title="Accounts by plan" data={chartData} dataKey="accounts" nameKey="plan">
        <WaffleKey />
        <WaffleGrid columns={20} cell={10} />
        <WaffleNote>One square is 1% of the 948 accounts.</WaffleNote>
      </Waffle>
      <ChartTooltip />
    </ChartContainer>
  );
}
