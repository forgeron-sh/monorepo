// Drag a row onto another (a line before or after, a dashed box inside), or press Alt + arrows
// on the focused row; F2 renames it. The tree gives the new items: this page keeps them.
import { Tree, structureFind, type TreeNode } from "@forgeron/ui";
import { useState } from "react";

const start: TreeNode[] = [
  {
    id: "notes",
    label: "Notes",
    children: [
      { id: "mon", label: "Monday sync" },
      { id: "tue", label: "Tuesday review" },
      { id: "wed", label: "Wednesday planning" },
    ],
  },
  { id: "ideas", label: "Ideas" },
  { id: "archive", label: "Archive", children: [{ id: "old", label: "Old notes" }] },
];

const rename = (nodes: TreeNode[], id: string, label: string): TreeNode[] =>
  nodes.map((n) =>
    n.id === id
      ? { ...n, label }
      : n.children
        ? { ...n, children: rename([...n.children] as TreeNode[], id, label) }
        : n,
  );

export default function ReorderAndRename() {
  const [items, setItems] = useState(start);
  const [log, setLog] = useState("Drag a row, or use Alt + arrows, or press F2.");
  return (
    <div style={{ display: "grid", gap: 8, width: 280 }}>
      <Tree
        items={items}
        label="Notes"
        defaultExpanded={["notes"]}
        onMove={(m) => {
          setItems(m.items);
          const to = m.parentId ? structureFind(m.items, m.parentId)?.label : "the top";
          setLog(`Moved ${m.ids.join(", ")} into ${to}, place ${m.index + 1}`);
        }}
        onRename={(id, label) => {
          setItems((all) => rename(all, id, label));
          setLog(`Renamed to ${label}`);
        }}
      />
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>{log}</span>
    </div>
  );
}
