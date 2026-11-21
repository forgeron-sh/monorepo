import { LayersPanel, type EditorLayer } from "@forgeron/ui";
import { useState } from "react";

const initial: EditorLayer[] = [
  { id: "title", name: "Title", kind: "Text" },
  {
    id: "hero",
    name: "Hero",
    kind: "Group",
    children: [
      { id: "image", name: "Cover image", kind: "Image" },
      { id: "badge", name: "Badge", kind: "Rect", locked: true },
      {
        id: "deco",
        name: "Decoration",
        kind: "Group",
        children: [
          { id: "dot1", name: "Dot 1", kind: "Ellipse" },
          { id: "dot2", name: "Dot 2", kind: "Ellipse", visible: false },
        ],
      },
    ],
  },
  { id: "cta", name: "Call to action", kind: "Rect" },
  { id: "bg", name: "Background", kind: "Rect", locked: true },
];

export default function Default() {
  const [layers, setLayers] = useState(initial);
  const [selected, setSelected] = useState<string[]>(["image"]);
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <LayersPanel
        label="Layers"
        layers={layers}
        onChange={setLayers}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <p style={{ font: "400 12px var(--font-mono)", color: "var(--ink-muted)", marginTop: 12 }}>
        CLICK, ⌘ CLICK, ⇧ CLICK · F2 RENAME · H HIDE · L LOCK · ⌥ ARROWS MOVE · DRAG
      </p>
    </div>
  );
}
