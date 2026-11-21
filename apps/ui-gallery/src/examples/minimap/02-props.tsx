import { Minimap, type EditorRect } from "@forgeron/ui";
import { useState } from "react";

const items = [
  { id: "a", x: 0, y: 0, w: 600, h: 400 },
  { id: "b", x: 700, y: 120, w: 500, h: 300, tone: "accent" as const },
  { id: "c", x: 300, y: 560, w: 700, h: 360 },
  { id: "d", x: 1300, y: 600, w: 300, h: 300, tone: "muted" as const },
];

export default function Default() {
  const [viewport, setViewport] = useState<EditorRect>({ x: 200, y: 100, w: 640, h: 400 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <Minimap
        label="Canvas overview"
        items={items}
        viewport={viewport}
        onViewportChange={setViewport}
      />
      <span style={{ font: "400 12px var(--font-mono)", color: "var(--ink-muted)" }}>
        X {Math.round(viewport.x)} · Y {Math.round(viewport.y)} · W {Math.round(viewport.w)} ·
        ARROWS PAN, + − ZOOM
      </span>
    </div>
  );
}
