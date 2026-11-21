import {
  TimePicker,
  TimePickerHour,
  TimePickerList,
  TimePickerMinute,
  TimePickerPeriod,
  TimePickerSeparator,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [time, setTime] = useState<string | null>("14:30");
  return (
    <TimePicker label="Start time" hour12 step={30} value={time} onChange={setTime}>
      <TimePickerHour />
      <TimePickerSeparator />
      <TimePickerMinute />
      <TimePickerPeriod />
      <TimePickerList />
    </TimePicker>
  );
}
