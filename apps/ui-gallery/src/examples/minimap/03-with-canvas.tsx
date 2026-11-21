import { Minimap, type EditorRect } from "@forgeron/ui";
import { useState } from "react";

const items = [
  { id: "a", x: 0, y: 0, w: 600, h: 400, label: "Brief" },
  { id: "b", x: 700, y: 120, w: 500, h: 300, label: "Moodboard" },
  { id: "c", x: 300, y: 560, w: 700, h: 360, label: "Flow" },
  { id: "d", x: 1300, y: 600, w: 300, h: 300, label: "Notes" },
];
const SCREEN = { w: 360, h: 240 };

export default function WithCanvas() {
  const [viewport, setViewport] = useState<EditorRect>({ x: 100, y: 60, w: 720, h: 480 });
  const zoom = SCREEN.w / viewport.w;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
      <div
        role="img"
        aria-label="Canvas, as seen through the minimap's rectangle"
        style={{
          position: "relative",
          width: SCREEN.w,
          height: SCREEN.h,
          overflow: "hidden",
          border: "1px solid var(--line-strong)",
          background: "var(--bg-sunk)",
        }}
      >
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              position: "absolute",
              left: (it.x - viewport.x) * zoom,
              top: (it.y - viewport.y) * zoom,
              width: it.w * zoom,
              height: it.h * zoom,
              border: "1px solid var(--ink-dim)",
              background: "var(--bg-raised)",
              padding: 4,
              font: "400 11px var(--font-mono)",
              color: "var(--ink-muted)",
              textTransform: "uppercase",
            }}
          >
            {it.label}
          </div>
        ))}
      </div>
      <Minimap
        label="Canvas overview"
        items={items}
        viewport={viewport}
        onViewportChange={setViewport}
        width={220}
        height={160}
      />
    </div>
  );
}
