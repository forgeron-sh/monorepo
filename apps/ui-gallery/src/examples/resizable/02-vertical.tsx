import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@forgeron/ui";
import { useState } from "react";

const pane = {
  display: "grid",
  placeItems: "center",
  height: "100%",
  color: "var(--ink-muted)",
  font: "13px var(--font-sans)",
} as const;

// The layout is the caller's: `layout` and `onLayout`, in percent.
export default function Vertical() {
  const [layout, setLayout] = useState([60, 40]);
  return (
    <div style={{ width: "min(100%, 560px)", height: 260 }}>
      <ResizablePanelGroup direction="vertical" layout={layout} onLayout={setLayout}>
        <ResizablePanel minSize={20}>
          <div style={pane}>Editor, {Math.round(layout[0]!)}%</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={20}>
          <div style={pane}>Console, {Math.round(layout[1]!)}%</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
