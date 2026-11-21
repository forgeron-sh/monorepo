// The actions of the selection declared once with useActions: the right click, the ⋯ of a row,
// the selection bar and the keys run the same code. Drag a file onto a folder, press F2 to
// rename, Delete to trash, double click a folder to go in.
import { Delete02Icon, Download01Icon, Edit02Icon, StarIcon, UserAdd01Icon } from "@forgeron/icons";
import {
  Breadcrumb,
  Button,
  FileBrowser,
  SelectionBar,
  useActions,
  type Action,
  type DriveItem,
} from "@forgeron/ui";
import { useState } from "react";

interface Node extends DriveItem {
  parent: string;
}

const START: Node[] = [
  {
    id: "f1",
    parent: "my",
    name: "Contracts",
    kind: "folder",
    modified: "2026-11-10 10:02",
    owner: "Léa Martin",
  },
  {
    id: "f2",
    parent: "my",
    name: "Sales",
    kind: "folder",
    modified: "2026-11-14 17:30",
    owner: "Camille Roy",
  },
  {
    id: "a",
    parent: "my",
    name: "Dock plan.pdf",
    size: 240_000,
    modified: "2026-11-18 09:12",
    owner: "Léa Martin",
  },
  {
    id: "b",
    parent: "my",
    name: "Tariffs 2027.xlsx",
    size: 52_400,
    modified: "2026-11-12 16:40",
    owner: "Camille Roy",
  },
  {
    id: "c",
    parent: "my",
    name: "Gate B at night.jpg",
    size: 1_840_000,
    modified: "2026-10-02 08:15",
    owner: "Tom Garnier",
  },
  {
    id: "d",
    parent: "f1",
    name: "Forklift lease.pdf",
    size: 410_000,
    modified: "2026-10-08 12:00",
    owner: "Léa Martin",
  },
];

export default function ActionsAndMoves() {
  const [nodes, setNodes] = useState(START);
  const [folder, setFolder] = useState("my");
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const items = nodes.filter((n) => n.parent === folder);
  const patch = (ids: string[], change: (n: Node) => Partial<Node>) =>
    setNodes((all) => all.map((n) => (ids.includes(n.id) ? { ...n, ...change(n) } : n)));
  const trash = (ids: string[]) => {
    setNodes((all) => all.filter((n) => !ids.includes(n.id)));
    setSelected([]);
  };

  const one = selected.length === 1;
  const list: Action[] = [
    {
      id: "share",
      label: "Share",
      icon: UserAdd01Icon,
      disabled: !one,
      run: () => patch(selected, () => ({ shared: true })),
    },
    { id: "download", label: "Download", icon: Download01Icon },
    {
      id: "star",
      label: "Star",
      icon: StarIcon,
      run: () => patch(selected, (n) => ({ starred: !n.starred })),
    },
    {
      id: "rename",
      label: "Rename",
      icon: Edit02Icon,
      disabled: !one,
      run: () => setRenaming(selected[0] ?? null),
    },
    {
      id: "trash",
      label: "Move to trash",
      icon: Delete02Icon,
      danger: true,
      run: () => trash(selected),
    },
  ];
  const actions = useActions(list, { shortcuts: false });

  return (
    <div style={{ display: "grid", gap: 10, width: "100%" }}>
      <Breadcrumb
        items={
          folder === "my"
            ? [{ label: "My files" }]
            : [
                { label: "My files", href: "#" },
                { label: nodes.find((n) => n.id === folder)?.name ?? "" },
              ]
        }
      />
      {folder !== "my" ? (
        <Button variant="ghost" size="sm" onClick={() => setFolder("my")}>
          Back to My files
        </Button>
      ) : null}
      <div style={{ minHeight: 40 }}>
        {selected.length > 0 ? (
          <SelectionBar
            count={selected.length}
            onClear={() => setSelected([])}
            actions={list}
            iconOnly={["star", "trash"]}
          />
        ) : null}
      </div>
      <FileBrowser
        items={items}
        today="2026-11-18"
        selected={selected}
        onSelectedChange={setSelected}
        onOpen={(id) => {
          const n = nodes.find((x) => x.id === id);
          if (n?.kind === "folder") {
            setFolder(id);
            setSelected([]);
          }
        }}
        menu={() => actions.menu}
        onAction={(id) => actions.run(id)}
        onMove={(ids, to) => {
          patch(ids, () => ({ parent: to }));
          setSelected([]);
        }}
        onRename={(id, name) => patch([id], () => ({ name }))}
        renaming={renaming}
        onRenamingChange={setRenaming}
        onDelete={trash}
      />
    </div>
  );
}
