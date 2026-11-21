import { TimezonePicker, TimezonePickerContent, TimezonePickerInput } from "@forgeron/ui";

// The parts: TimezonePicker without a label is the root of an input and its list.
export default function Composed() {
  return (
    <div style={{ width: 320 }}>
      <TimezonePicker defaultValue="Europe/Paris" now={Date.UTC(2026, 10, 18, 12)}>
        <TimezonePickerInput aria-label="Time zone" />
        <TimezonePickerContent />
      </TimezonePicker>
    </div>
  );
}
