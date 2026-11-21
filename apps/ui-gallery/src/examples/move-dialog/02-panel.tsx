import { Briefcase01Icon, Home01Icon } from "@forgeron/icons";
import { MovePanel, type FolderNode } from "@forgeron/ui";

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

export default function Panel() {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <MovePanel
        folders={folders}
        from="My files"
        disabledIds={["my"]}
        defaultValue="contracts"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
}
