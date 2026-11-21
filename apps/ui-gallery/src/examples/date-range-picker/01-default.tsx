import {
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerContent,
  DateRangePickerFooter,
  DateRangePickerPresets,
  DateRangePickerTrigger,
  type DateRange,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [period, setPeriod] = useState<DateRange>({ from: "2026-11-10", to: "2026-11-17" });
  return (
    <DateRangePicker today="2026-11-17" value={period} onChange={setPeriod}>
      <DateRangePickerTrigger label="Period" />
      <DateRangePickerContent label="Period">
        <DateRangePickerPresets />
        <DateRangePickerCalendar label="Period" />
        <DateRangePickerFooter />
      </DateRangePickerContent>
    </DateRangePicker>
  );
}
