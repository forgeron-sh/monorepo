import { Segmented, FileBrowser, type DriveItem } from "@forgeron/ui";
import { useState } from "react";

const items: DriveItem[] = [
  { id: "f1", name: "Contracts", kind: "folder" },
  { id: "f2", name: "Photos of the yard", kind: "folder", starred: true },
  { id: "a", name: "Dock plan.pdf", size: 240_000, modified: "2026-11-18 09:12" },
  { id: "b", name: "Tariffs 2027.xlsx", size: 52_400, modified: "2026-11-12 16:40" },
  { id: "c", name: "Proposal Lyon Logistique.docx", size: 88_000, modified: "2026-11-15 11:00" },
  { id: "d", name: "Kick-off 2027.pptx", size: 3_400_000, modified: "2026-11-03 14:20" },
  {
    id: "e",
    name: "Gate B at night.jpg",
    size: 1_840_000,
    modified: "2026-10-02 08:15",
    shared: true,
  },
  { id: "g", name: "Forklift safety.mp4", size: 48_000_000, modified: "2026-09-20 10:00" },
  {
    id: "h",
    name: "Invoices 2025.zip",
    size: 12_600_000,
    modified: "2026-01-04 09:00",
    locked: true,
  },
];

// Folders as tiles, files as cards with a drawing of their kind; the arrows move in two
// directions, a lasso from the empty space selects a block of cards.
export default function Grid() {
  const [layout, setLayout] = useState("grid");
  return (
    <div style={{ display: "grid", gap: 12, width: "100%" }}>
      <div>
        <Segmented
          label="Layout"
          options={[
            { value: "list", label: "List" },
            { value: "grid", label: "Grid" },
          ]}
          value={layout}
          onChange={setLayout}
        />
      </div>
      <FileBrowser items={items} layout={layout === "grid" ? "grid" : "list"} today="2026-11-18" />
    </div>
  );
}
