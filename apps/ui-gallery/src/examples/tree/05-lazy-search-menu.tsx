// A search that keeps what matches, children loaded when a node opens, several rows selected,
// and a right-click menu on the selection.
import { Input, Tree, type ActionMenuEntry, type TreeNode } from "@forgeron/ui";
import { useState } from "react";

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

const menu = (): ActionMenuEntry[] => [
  { id: "open", label: "Open" },
  { id: "copy", label: "Copy link" },
  { separator: true },
  { id: "remove", label: "Remove", danger: true },
];

export default function LazySearchMenu() {
  const [items, setItems] = useState<TreeNode[]>([
    { id: "eu", label: "Europe", hasChildren: true },
    { id: "am", label: "Americas", hasChildren: true },
    {
      id: "as",
      label: "Asia",
      children: [
        { id: "jp", label: "Japan" },
        { id: "sg", label: "Singapore" },
      ],
    },
  ]);
  const [query, setQuery] = useState("");
  const [log, setLog] = useState("Right-click a row");

  const load = async (id: string) => {
    await wait(700);
    const kids: Record<string, TreeNode[]> = {
      eu: [
        { id: "fr", label: "France", count: 4 },
        { id: "de", label: "Germany", count: 2 },
      ],
      am: [
        { id: "us", label: "United States", count: 6 },
        { id: "br", label: "Brazil" },
      ],
    };
    setItems((all) => all.map((n) => (n.id === id ? { ...n, children: kids[id] ?? [] } : n)));
  };

  return (
    <div style={{ display: "grid", gap: 8, width: 280 }}>
      <Input
        type="search"
        aria-label="Filter regions"
        placeholder="Filter"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Tree
        items={items}
        label="Regions"
        selectionMode="multiple"
        filter={query}
        empty="No region matches"
        onLoadChildren={load}
        menu={menu}
        onAction={(id, ids) => setLog(`${id}: ${ids.join(", ")}`)}
      />
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>{log}</span>
    </div>
  );
}
