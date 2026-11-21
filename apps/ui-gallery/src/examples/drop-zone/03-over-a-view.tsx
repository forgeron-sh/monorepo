// With children, the zone covers a view and shows itself only while files are dragged over it.
// Drag a file from your computer onto the list. Only PDFs are taken here.
import { DropZone, FileBrowser, type DriveItem } from "@forgeron/ui";
import { useState } from "react";

export default function OverAView() {
  const [items, setItems] = useState<DriveItem[]>([
    { id: "a", name: "Dock plan.pdf", size: 240_000, modified: "2026-11-18 09:12" },
  ]);
  const [refused, setRefused] = useState("");
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <DropZone
        accept=".pdf"
        overlayLabel="Drop to upload to Contracts"
        onFiles={(files) =>
          setItems((all) => [
            ...all,
            ...files.map((f, i) => ({
              id: `${f.name}-${all.length + i}`,
              name: f.name,
              size: f.size,
            })),
          ])
        }
        onReject={(files) => setRefused(`Not a PDF: ${files.map((f) => f.name).join(", ")}`)}
      >
        <FileBrowser items={items} columns={["size"]} />
      </DropZone>
      <span style={{ color: "var(--danger)", font: "400 11px/16px var(--font-mono)" }}>
        {refused}
      </span>
    </div>
  );
}
