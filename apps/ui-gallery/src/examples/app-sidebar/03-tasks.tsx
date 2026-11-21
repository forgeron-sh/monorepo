import {
  CheckmarkSquare01Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  Folder01Icon,
  HelpCircleIcon,
  InboxIcon,
  Layers01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  RefreshIcon,
  Search01Icon,
  Tick01Icon,
  UserAdd01Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@forgeron/icons";
import { AppSidebar, Avatar, IconButton } from "@forgeron/ui";
import { useState } from "react";

const team = (key: string) => [
  { href: `#/team/${key}/issues`, label: "Issues", icon: CheckmarkSquare01Icon },
  { href: `#/team/${key}/projects`, label: "Projects", icon: Folder01Icon },
  { href: `#/team/${key}/views`, label: "Views", icon: Layers01Icon },
];

export default function Tasks() {
  const [current, setCurrent] = useState("#/team/OPS/issues");
  return (
    <div style={{ width: 260, height: 520, border: "1px solid var(--line)" }}>
      <AppSidebar
        app={{ name: "Tasks", icon: Tick01Icon }}
        appMenu={[
          { heading: "Atelier Moreau" },
          { id: "console", label: "Console", icon: DashboardSquare01Icon },
          { id: "tasks", label: "Tasks", icon: Tick01Icon, checked: true },
          { id: "crm", label: "CRM", icon: UserGroupIcon },
          { id: "notes", label: "Notes", icon: Note01Icon },
        ]}
        onAppMenuSelect={() => {}}
        actions={
          <>
            <IconButton icon={Search01Icon} label="Search" size="sm" />
            <IconButton icon={Edit02Icon} label="New issue" size="sm" variant="boxed" />
          </>
        }
        current={current}
        onNavigate={(href, event) => {
          event.preventDefault();
          setCurrent(href);
        }}
        items={[
          { href: "#/inbox", label: "Inbox", icon: InboxIcon, count: 4 },
          { href: "#/my", label: "My issues", icon: UserCircleIcon },
        ]}
        sections={[
          {
            label: "Workspace",
            items: [
              { href: "#/projects", label: "Projects", icon: Folder01Icon },
              { href: "#/views", label: "Views", icon: Layers01Icon },
              { href: "#/more", label: "More", icon: MoreHorizontalIcon },
            ],
          },
          {
            label: "Your teams",
            items: [
              { label: "Operations", initial: "O", items: team("OPS") },
              { label: "Sales", initial: "S", items: team("SAL"), defaultOpen: false },
            ],
          },
          {
            label: "Try",
            defaultOpen: false,
            items: [
              { href: "#/invite", label: "Invite people", icon: UserAdd01Icon },
              { href: "#/cycles", label: "Cycles", icon: RefreshIcon },
            ],
          },
        ]}
        footer={
          <>
            <IconButton
              icon={HelpCircleIcon}
              label="Keyboard shortcuts"
              size="sm"
              variant="boxed"
            />
            <Avatar name="Camille Roy" />
          </>
        }
      />
    </div>
  );
}
