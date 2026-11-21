import {
  FillPicker,
  FillPickerColor,
  FillPickerOpacity,
  FillPickerPatterns,
  FillPickerType,
  type EditorFill,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [fill, setFill] = useState<EditorFill>({
    type: "pattern",
    pattern: "hatch",
    color: "#ff4f1f",
  });
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <FillPicker label="Fill" value={fill} onChange={setFill}>
        <FillPickerType />
        <FillPickerColor />
        <FillPickerPatterns />
        <FillPickerOpacity />
      </FillPicker>
    </div>
  );
}
