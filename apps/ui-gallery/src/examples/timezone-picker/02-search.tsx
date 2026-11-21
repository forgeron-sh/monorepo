import { TimezonePicker } from "@forgeron/ui";

export default function Search() {
  return (
    <div style={{ width: 320 }}>
      <TimezonePicker
        label="Time zone"
        defaultValue="Europe/Paris"
        now={Date.UTC(2026, 10, 18, 12)}
      />
    </div>
  );
}
