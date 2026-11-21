import { MatrixField, type FormMatrixAnswer } from "@forgeron/ui";
import { useState } from "react";

const rows = [
  { id: "speed", label: "Speed" },
  { id: "docs", label: "Documentation" },
  { id: "support", label: "Support" },
];
const columns = [
  { id: "1", label: "Poor" },
  { id: "2", label: "Fair" },
  { id: "3", label: "Good" },
  { id: "4", label: "Great" },
];

export default function Default() {
  const [value, setValue] = useState<FormMatrixAnswer>({ speed: "3" });
  return (
    <div style={{ width: 520, maxWidth: "100%" }}>
      <MatrixField
        label="How satisfied are you with each part?"
        rows={rows}
        columns={columns}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
