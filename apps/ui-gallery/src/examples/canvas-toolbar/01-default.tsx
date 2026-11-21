import {
  CircleIcon,
  Cursor02Icon,
  HandIcon,
  LineIcon,
  Pen01Icon,
  Square01Icon,
  TextIcon,
  TriangleIcon,
} from "@forgeron/icons";
import {
  CanvasToolbar,
  CanvasToolbarRedo,
  CanvasToolbarSeparator,
  CanvasToolbarTool,
  CanvasToolbarUndo,
} from "@forgeron/ui";
import { useState } from "react";

const tools = [
  { id: "select", label: "Select", icon: Cursor02Icon, shortcut: "v", group: "pointer" },
  { id: "hand", label: "Hand", icon: HandIcon, shortcut: "h", group: "pointer" },
  {
    id: "shape",
    label: "Shape",
    icon: Square01Icon,
    shortcut: "r",
    group: "draw",
    variants: [
      { id: "rect", label: "Rectangle", icon: Square01Icon },
      { id: "ellipse", label: "Ellipse", icon: CircleIcon, shortcut: "o" },
      { id: "triangle", label: "Triangle", icon: TriangleIcon },
      { id: "line", label: "Line", icon: LineIcon, shortcut: "l" },
    ],
  },
  { id: "pen", label: "Pen", icon: Pen01Icon, shortcut: "p", group: "draw" },
  { id: "text", label: "Text", icon: TextIcon, shortcut: "t", group: "draw" },
];

export default function Default() {
  const [tool, setTool] = useState("select");
  const [history, setHistory] = useState({ past: 2, future: 0 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <CanvasToolbar
        label="Drawing tools"
        tools={tools}
        value={tool}
        onChange={setTool}
        canUndo={history.past > 0}
        canRedo={history.future > 0}
        onUndo={() => setHistory(({ past, future }) => ({ past: past - 1, future: future + 1 }))}
        onRedo={() => setHistory(({ past, future }) => ({ past: past + 1, future: future - 1 }))}
      >
        {tools.map((t) => (
          <CanvasToolbarTool key={t.id} tool={t} />
        ))}
        <CanvasToolbarSeparator />
        <CanvasToolbarUndo />
        <CanvasToolbarRedo />
      </CanvasToolbar>
      <span style={{ font: "400 12px var(--font-mono)", color: "var(--ink-muted)" }}>
        TOOL {tool.toUpperCase()} · UNDO {history.past} · REDO {history.future} · TRY V H R O P T
      </span>
    </div>
  );
}
