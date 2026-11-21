// The preview of a folder's files one after the other: the arrows (and ← →) go to the
// neighbours, the details sit beside the stage. Kinds without a source draw a placeholder.
import { FileDetails, FilePreview, type FileKind } from "@forgeron/ui";
import { useState } from "react";

const FILES: Array<{
  name: string;
  kind?: FileKind;
  size: number;
  text?: string;
  entries?: { name: string; size: number }[];
}> = [
  { name: "Gate B at night.jpg", size: 1_840_000 },
  { name: "Dock plan.pdf", size: 240_000 },
  {
    name: "Notes.txt",
    size: 320,
    text: "Racks 1–7: aisle 7 uprights tagged red after the safety walk.",
  },
  {
    name: "Invoices 2025.zip",
    size: 12_600_000,
    entries: [
      { name: "INV-2025-001.pdf", size: 84_000 },
      { name: "INV-2025-002.pdf", size: 91_000 },
    ],
  },
  { name: "setup.bin", size: 4_200_000 },
];

export default function WithDetails() {
  const [at, setAt] = useState(0);
  const file = FILES[at]!;
  return (
    <div style={{ width: "100%" }}>
      <FilePreview
        {...file}
        meta="Tom Garnier · Oct 2"
        position={{ index: at + 1, total: FILES.length }}
        {...(at > 0 ? { onPrevious: () => setAt(at - 1) } : {})}
        {...(at < FILES.length - 1 ? { onNext: () => setAt(at + 1) } : {})}
        onDownload={() => {}}
        onClose={() => {}}
        aside={
          <FileDetails
            name={file.name}
            size={file.size}
            owner="Tom Garnier"
            location="My files › Photos"
            modified="Oct 2, 2026 · 08:15"
            access={{
              people: ["Tom Garnier", "Léa Martin"],
              summary: "Restricted to the people above",
            }}
          />
        }
      />
    </div>
  );
}
