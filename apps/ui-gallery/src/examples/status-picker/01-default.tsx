import { StatusPicker, type StatusKind } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [status, setStatus] = useState<StatusKind>("review");
  return <StatusPicker value={status} onChange={setStatus} />;
}
