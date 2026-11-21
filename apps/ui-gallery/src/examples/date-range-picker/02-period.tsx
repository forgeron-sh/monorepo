import { DateRangePicker, type DateRange } from "@forgeron/ui";
import { useState } from "react";

export default function Period() {
  const [range, setRange] = useState<DateRange>({ from: "2026-11-03", to: "2026-11-18" });
  return <DateRangePicker label="Period" today="2026-11-19" value={range} onChange={setRange} />;
}
