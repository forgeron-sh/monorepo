// Subfolders load on first opening (a promise shows the wait); drag a file onto a folder, or
// drop files from your computer. Invoices is an app's folder: read-only, it takes no drop.
import { Home01Icon, Invoice01Icon } from "@forgeron/icons";
import { FileBrowser, FolderTree, type DriveItem, type FolderNode } from "@forgeron/ui";
import { useState } from "react";

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

export default function LazyAndDrop() {
  const [folders, setFolders] = useState<FolderNode[]>([
    {
      id: "my",
      name: "My files",
      icon: Home01Icon,
      children: [
        { id: "archive", name: "Archive", hasChildren: true },
        { id: "contracts", name: "Contracts", children: [] },
      ],
    },
    { id: "invoices", name: "Invoices", icon: Invoice01Icon, readOnly: true, children: [] },
  ]);
  const [current, setCurrent] = useState("contracts");
  const [log, setLog] = useState("Drag a file onto a folder");
  const files: DriveItem[] = [
    { id: "a", name: "Dock plan.pdf", size: 240_000, modified: "2026-11-18 09:12" },
    { id: "b", name: "Tariffs 2027.xlsx", size: 52_400, modified: "2026-11-12 16:40" },
  ];

  const load = async (id: string) => {
    await wait(900);
    setFolders((all) =>
      all.map((root) => ({
        ...root,
        children: root.children?.map((c) =>
          c.id === id
            ? {
                ...c,
                children: [
                  { id: "2024", name: "2024", children: [] },
                  { id: "2025", name: "2025", children: [] },
                ],
              }
            : c,
        ),
      })),
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, width: "100%" }}>
      <FolderTree
        folders={folders}
        defaultExpanded={["my"]}
        selected={current}
        onSelectedChange={setCurrent}
        onLoadChildren={load}
        onDrop={(to, drop) =>
          setLog(
            drop.files.length
              ? `${drop.files.length} file(s) to upload to ${to}`
              : `Moved ${drop.ids.join(", ")} to ${to}`,
          )
        }
      />
      <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
        <FileBrowser items={files} onMove={() => {}} columns={["size"]} lasso={false} />
        <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
          {log}
        </span>
      </div>
    </div>
  );
}
