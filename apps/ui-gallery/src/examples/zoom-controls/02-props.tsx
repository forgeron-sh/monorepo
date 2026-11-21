import { editorFillZoom, editorFitZoom, ZoomControls } from "@forgeron/ui";
import { useState } from "react";

const content = { w: 1600, h: 900 };
const screen = { w: 640, h: 400 };

export default function Default() {
  const [zoom, setZoom] = useState(1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <ZoomControls
        zoom={zoom}
        onZoomChange={setZoom}
        onFit={() => setZoom(editorFitZoom(content, screen, 32))}
        onFill={() => setZoom(editorFillZoom(content, screen))}
        bindShortcuts
      />
      <span style={{ font: "400 12px var(--font-mono)", color: "var(--ink-muted)" }}>
        ZOOM {zoom.toFixed(3)} · TRY ⌘+ ⌘− ⌘0 ⇧1 ⇧2
      </span>
    </div>
  );
}
