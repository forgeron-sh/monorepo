import { DatePicker } from "@forgeron/ui";

export default function Field() {
  return (
    <DatePicker
      label="Invoice date"
      variant="field"
      today="2026-11-17"
      presets={[]}
      clearable={false}
      defaultValue="2026-11-17"
    />
  );
}
