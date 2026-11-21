import { Calendar } from "@forgeron/ui";

export default function RangeLimit() {
  return <Calendar label="Delivery date" today="2026-11-17" min="2026-11-17" max="2026-12-11" />;
}
