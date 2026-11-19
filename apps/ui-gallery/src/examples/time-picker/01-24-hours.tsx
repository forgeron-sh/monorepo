import { TimePicker } from "@forgeron/ui";
import { useState } from "react";

export default function Hours24() {
  const [time, setTime] = useState<string | null>("14:30");
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <TimePicker label="Start time" value={time} onChange={setTime} />
      <code>{time ?? "none"}</code>
    </div>
  );
}
