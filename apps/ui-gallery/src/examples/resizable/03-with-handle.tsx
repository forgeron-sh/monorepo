import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@forgeron/ui";

const pane = {
  display: "grid",
  placeItems: "center",
  height: "100%",
  color: "var(--ink-muted)",
  font: "13px var(--font-sans)",
} as const;

// A grip on the handle, and a collapsible panel: drag it under its minimum, or press Enter on the handle.
export default function WithHandle() {
  return (
    <div style={{ width: "min(100%, 560px)", height: 200 }}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} collapsible>
          <div style={pane}>Collapsible</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div style={pane}>Main. Focus the handle: arrows, Home, End, Enter.</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
