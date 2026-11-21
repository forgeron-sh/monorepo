import { Briefcase01Icon, Home01Icon, TruckIcon } from "@forgeron/icons";
import { FolderTree, type FolderNode } from "@forgeron/ui";

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

export default function Default() {
  return (
    <div style={{ width: 240 }}>
      <FolderTree
        folders={folders}
        defaultExpanded={["my", "contracts"]}
        defaultSelected="leases"
      />
    </div>
  );
}
