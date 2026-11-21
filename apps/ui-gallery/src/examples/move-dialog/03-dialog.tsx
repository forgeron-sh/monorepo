// Move or copy in a modal. The folder being moved and the one it is in cannot be picked; a double
// click on a folder confirms at once.
import { Briefcase01Icon, Home01Icon, TruckIcon } from "@forgeron/icons";
import { Button, folderLabel, MoveDialog, type FolderNode } from "@forgeron/ui";
import { useState } from "react";

const folders: FolderNode[] = [
  {
    id: "my",
    name: "My files",
    icon: Home01Icon,
    children: [
      {
        id: "contracts",
        name: "Contracts",
        children: [{ id: "leases", name: "Leases", children: [] }],
      },
      { id: "photos", name: "Photos", children: [] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: Briefcase01Icon,
    children: [{ id: "quotes", name: "Quotes", children: [] }],
  },
  { id: "ops", name: "Operations", icon: TruckIcon, children: [] },
];

export default function DialogExample() {
  const [mode, setMode] = useState<"move" | "copy" | null>(null);
  const [done, setDone] = useState("");
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={() => setMode("move")}>Move “Contracts”</Button>
        <Button onClick={() => setMode("copy")}>Copy “Contracts”</Button>
      </div>
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
        {done}
      </span>
      {mode ? (
        <MoveDialog
          mode={mode}
          itemLabel="“Contracts”"
          folders={folders}
          from="My files"
          disabledIds={mode === "move" ? ["contracts", "my"] : []}
          onConfirm={(id) =>
            setDone(`${mode === "move" ? "Moved" : "Copied"} to ${folderLabel(folders, id)}`)
          }
          onClose={() => setMode(null)}
        />
      ) : null}
    </div>
  );
}
