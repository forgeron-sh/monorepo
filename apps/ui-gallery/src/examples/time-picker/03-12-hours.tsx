import { TimePicker } from "@forgeron/ui";

export default function Hours12() {
  return <TimePicker label="Reminder" hour12 step={30} defaultValue="09:30" />;
}
