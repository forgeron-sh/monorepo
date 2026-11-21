import { ChartContainer, ChartTooltip, Donut, type ChartConfig } from "@forgeron/ui";

const chartConfig = {
  email: { label: "Email" },
  chat: { label: "Chat" },
  phone: { label: "Phone" },
} satisfies ChartConfig;

export default function InAContainer() {
  return (
    <ChartContainer config={chartConfig}>
      <Donut
        title="Tickets by channel"
        items={[
          { label: "email", value: 48 },
          { label: "chat", value: 31 },
          { label: "phone", value: 9 },
        ]}
      />
      <ChartTooltip />
    </ChartContainer>
  );
}
