import { ColorPicker } from "@forgeron/ui";
import { useState } from "react";

export default function Popup() {
  const [color, setColor] = useState<string | null>("#ff4f1f");
  return <ColorPicker label="Label colour" value={color} onChange={setColor} />;
}
