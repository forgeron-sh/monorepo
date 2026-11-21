import { SplitPane } from "@forgeron/ui";
import { useState } from "react";

const pane = { padding: 16, color: "var(--ink-muted)", font: "13px var(--font-sans)" } as const;

export default function Sidebar() {
  const [size, setSize] = useState(240);
  return (
    <div style={{ width: "min(100%, 560px)", height: 220 }}>
      <SplitPane
        label="Resize the list"
        size={size}
        onChange={setSize}
        first={<div style={pane}>List, {size}px</div>}
        second={<div style={pane}>Detail. Drag the divider, or focus it and use the arrows.</div>}
      />
    </div>
  );
}
