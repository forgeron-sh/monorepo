import { Briefcase01Icon, Home01Icon } from "@forgeron/icons";
import { FolderTree, FolderTreeItem, type FolderNode } from "@forgeron/ui";

const folders: FolderNode[] = [
  {
    id: "my",
    name: "My files",
    icon: Home01Icon,
    children: [
      { id: "contracts", name: "Contracts", children: [] },
      { id: "photos", name: "Photos", children: [] },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: Briefcase01Icon,
    children: [{ id: "quotes", name: "Quotes", children: [] }],
  },
];

export default function Composed() {
  return (
    <div style={{ width: 240 }}>
      <FolderTree folders={folders} defaultExpanded={["my"]} defaultSelected="contracts">
        {folders.map((node) => (
          <FolderTreeItem key={node.id} node={node} />
        ))}
      </FolderTree>
    </div>
  );
}
