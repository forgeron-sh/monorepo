import { PriorityPicker, type PriorityLevel } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [priority, setPriority] = useState<PriorityLevel>(1);
  return (
    <>
      <PriorityPicker value={priority} onChange={setPriority} />
      <PriorityPicker defaultValue={3} markOnly />
    </>
  );
}
