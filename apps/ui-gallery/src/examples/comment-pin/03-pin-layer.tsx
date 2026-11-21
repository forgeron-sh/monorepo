import { Button, PinLayer, type EditorPinData } from "@forgeron/ui";
import { useState } from "react";

const pins: EditorPinData[] = [
  { id: "p1", x: 80, y: 90, author: "Léa", preview: "Can the title be bigger?", unread: true },
  { id: "p2", x: 300, y: 150, author: "Karim", preview: "Colour is off here." },
  { id: "p3", x: 190, y: 220, author: "Jo", preview: "Done, thanks.", resolved: true },
];

export default function PinLayerDemo() {
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [hide, setHide] = useState(false);
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 520 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" onClick={() => setView((v) => ({ ...v, zoom: v.zoom === 1 ? 1.5 : 1 }))}>
          Zoom {view.zoom === 1 ? "150%" : "100%"}
        </Button>
        <Button size="sm" onClick={() => setView((v) => ({ ...v, x: v.x === 0 ? 40 : 0 }))}>
          Pan
        </Button>
        <Button size="sm" onClick={() => setHide(!hide)}>
          {hide ? "Show resolved" : "Hide resolved"}
        </Button>
      </div>
      <div
        style={{
          position: "relative",
          height: 280,
          border: "1px solid var(--line-strong)",
          background: "var(--bg-sunk)",
        }}
      >
        <PinLayer
          label="Comments"
          pins={pins}
          view={view}
          hideResolved={hide}
          renderThread={(pin, close) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <strong>{pin.author}</strong>
              <span style={{ color: "var(--ink-muted)" }}>{pin.preview}</span>
              <Button size="sm" onClick={close}>
                {pin.resolved ? "Reopen" : "Resolve"}
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
