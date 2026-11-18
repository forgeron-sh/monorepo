import { IconPicker } from "@forgeron/ui";
import { useState } from "react";

// The page of Notes: the icon in its square over the title, "Add icon" when there is none.
export default function PageIcon() {
  const [icon, setIcon] = useState<string | null>("note-01");
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <IconPicker
        label="Page icon"
        size={48}
        value={icon}
        onChange={setIcon}
        recentsKey="ui-gallery:page-icons"
      />
      <span style={{ font: "600 22px/28px var(--font-sans)" }}>Onboarding checklist</span>
    </div>
  );
}
