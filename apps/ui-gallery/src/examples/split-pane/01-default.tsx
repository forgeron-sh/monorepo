import { SplitPane, SplitPaneHandle, SplitPanePanel } from "@forgeron/ui";
import { useState } from "react";

const pane = { padding: 16, color: "var(--ink-muted)", font: "13px var(--font-sans)" } as const;

// The same split from its parts: two panels around a handle. The second panel takes what is left.
export default function Composed() {
  const [size, setSize] = useState(240);
  return (
    <div style={{ width: "min(100%, 560px)", height: 220 }}>
      <SplitPane size={size} onChange={setSize} min={120}>
        <SplitPanePanel style={pane}>List, {size}px</SplitPanePanel>
        <SplitPaneHandle label="Resize the list" />
        <SplitPanePanel secondary style={pane}>
          Detail. Drag the divider, or focus it and use the arrows.
        </SplitPanePanel>
      </SplitPane>
    </div>
  );
}
