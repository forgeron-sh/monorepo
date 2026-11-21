import { Briefcase01Icon, Home01Icon } from "@forgeron/icons";
import { Tree, type TreeNode } from "@forgeron/ui";

const pages: TreeNode[] = [
  {
    id: "home",
    label: "Home",
    icon: Home01Icon,
    children: [
      { id: "welcome", label: "Welcome" },
      {
        id: "handbook",
        label: "Handbook",
        count: 3,
        children: [
          { id: "leave", label: "Leave policy" },
          { id: "expenses", label: "Expenses" },
          { id: "security", label: "Security" },
        ],
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: Briefcase01Icon,
    children: [{ id: "launch", label: "Launch plan" }],
  },
  { id: "inbox", label: "Inbox", count: 12 },
  { id: "locked", label: "Legal", readOnly: true },
];

export default function Default() {
  return (
    <div style={{ width: 260 }}>
      <Tree
        items={pages}
        label="Pages"
        defaultExpanded={["home", "handbook"]}
        defaultSelected={["leave"]}
      />
    </div>
  );
}
