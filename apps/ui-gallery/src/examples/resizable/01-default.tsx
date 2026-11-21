import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@forgeron/ui";

const pane = {
  display: "grid",
  placeItems: "center",
  height: "100%",
  color: "var(--ink-muted)",
  font: "13px var(--font-sans)",
} as const;

export default function Default() {
  return (
    <div style={{ width: "min(100%, 640px)", height: 200 }}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15}>
          <div style={pane}>Sidebar</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div style={pane}>Content</div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25} minSize={15}>
          <div style={pane}>Inspector</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
