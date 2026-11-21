import { IconByName, IconPicker, type IconTone } from "@forgeron/ui";
import { useState } from "react";

// A colour with the icon, as for a table of the data hub: the same name and tone drawn elsewhere.
export default function Tone() {
  const [icon, setIcon] = useState<string | null>("database");
  const [tone, setTone] = useState<IconTone>("accent");
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <IconPicker
        label="Table icon"
        value={icon}
        onChange={setIcon}
        tones
        tone={tone}
        onToneChange={setTone}
      />
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <IconByName name={icon} size={12} tone={tone} />
        Customers
      </span>
    </div>
  );
}
