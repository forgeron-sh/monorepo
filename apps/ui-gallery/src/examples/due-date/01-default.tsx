import { DatePicker } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [due, setDue] = useState<string | null>("2026-11-18");
  return <DatePicker label="Due date" today="2026-11-17" value={due} onChange={setDue} />;
}
