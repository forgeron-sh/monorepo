import { StrokePicker, type EditorStroke } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [stroke, setStroke] = useState<EditorStroke>({
    color: "#ff4f1f",
    width: 4,
    dash: "dashed",
    cap: "round",
    opacity: 0.9,
  });
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <StrokePicker label="Stroke" value={stroke} onChange={setStroke} />
    </div>
  );
}
