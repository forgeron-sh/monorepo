import {
  WidgetFrame,
  WidgetGrid,
  WidgetGridCanvas,
  WidgetGridContent,
  WidgetGridEditBar,
  WidgetGridGrab,
  WidgetGridItem,
  WidgetGridRemove,
  WidgetGridResize,
  WidgetGridStatus,
} from "@forgeron/ui";
import { useState } from "react";

const frame = (title: string, text: string) => (
  <WidgetFrame title={title}>
    <p style={{ margin: 0 }}>{text}</p>
  </WidgetFrame>
);

// The 2D layout stays the root's (it owns the drag and the layout); the cell, its content and its
// edit controls are parts.
export default function Default() {
  const [widgets, setWidgets] = useState([
    { id: "a", label: "Revenue", content: frame("Revenue", "€48.2k") },
    { id: "b", label: "Leads", content: frame("Leads", "212") },
    { id: "c", label: "Quota", content: frame("Quota", "72%"), locked: true },
  ]);
  return (
    <div style={{ width: "100%" }}>
      <WidgetGrid
        widgets={widgets}
        defaultEditing
        defaultLayout={[
          { id: "a", x: 0, y: 0, w: 4, h: 2 },
          { id: "b", x: 4, y: 0, w: 4, h: 2 },
          { id: "c", x: 8, y: 0, w: 4, h: 2 },
        ]}
        onRemoveWidget={(id) => setWidgets((all) => all.filter((w) => w.id !== id))}
      >
        <WidgetGridEditBar />
        <WidgetGridCanvas>
          {(widget) => (
            <WidgetGridItem id={widget.id}>
              <WidgetGridContent />
              <WidgetGridGrab />
              <WidgetGridResize />
              <WidgetGridRemove />
            </WidgetGridItem>
          )}
        </WidgetGridCanvas>
        <WidgetGridStatus />
      </WidgetGrid>
    </div>
  );
}
