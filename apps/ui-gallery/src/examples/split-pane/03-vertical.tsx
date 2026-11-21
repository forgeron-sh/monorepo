import { SplitPane } from "@forgeron/ui";

const pane = { padding: 16, color: "var(--ink-muted)", font: "13px var(--font-sans)" } as const;

export default function Vertical() {
  return (
    <div style={{ width: "min(100%, 560px)", height: 260 }}>
      <SplitPane
        direction="vertical"
        label="Resize the editor"
        defaultSize={120}
        min={80}
        minSecond={80}
        first={<div style={pane}>Editor</div>}
        second={<div style={pane}>Console</div>}
      />
    </div>
  );
}
