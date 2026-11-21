import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerPresets,
  DatePickerTrigger,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [due, setDue] = useState<string | null>("2026-11-18");
  return (
    <DatePicker today="2026-11-17" value={due} onChange={setDue}>
      <DatePickerTrigger label="Due date" variant="field" />
      <DatePickerContent label="Due date">
        <DatePickerPresets label="Due date" />
        <DatePickerCalendar label="Due date" />
      </DatePickerContent>
    </DatePicker>
  );
}
