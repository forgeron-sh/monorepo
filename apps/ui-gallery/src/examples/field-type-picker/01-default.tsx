import { FieldTypePicker, type FieldType } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [type, setType] = useState<FieldType>("relation");
  return <FieldTypePicker showLabel value={type} onChange={setType} />;
}
