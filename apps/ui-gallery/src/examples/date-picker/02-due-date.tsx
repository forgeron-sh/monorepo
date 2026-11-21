import { DatePicker } from "@forgeron/ui";
import { useState } from "react";

export default function DueDate() {
  const [due, setDue] = useState<string | null>("2026-11-18");
  return (
    <>
      <DatePicker label="Due date" today="2026-11-17" value={due} onChange={setDue} />
      <DatePicker label="Start date" today="2026-11-17" placeholder="Start date" />
    </>
  );
}
