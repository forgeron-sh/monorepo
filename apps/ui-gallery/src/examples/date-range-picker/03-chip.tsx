import { DateRangePicker } from "@forgeron/ui";

export default function Chip() {
  return (
    <DateRangePicker
      label="Sprint"
      variant="chip"
      today="2026-11-19"
      placeholder="Set sprint"
      presets={[]}
    />
  );
}
