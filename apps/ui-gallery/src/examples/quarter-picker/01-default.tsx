import { QuarterPicker } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [quarter, setQuarter] = useState<string | null>("2026-Q4");
  return <QuarterPicker years={[2026, 2027]} value={quarter} onChange={setQuarter} clearable />;
}
