import { Folder01Icon, InboxIcon, Tick01Icon, UserCircleIcon } from "@forgeron/icons";
import {
  AppSidebar,
  AppSidebarFooter,
  AppSidebarHeader,
  AppSidebarItem,
  AppSidebarLink,
  AppSidebarMenu,
  AppSidebarNav,
  AppSidebarSection,
  AppSidebarSwitcher,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [current, setCurrent] = useState("#/inbox");
  return (
    <div style={{ width: 220, height: 260 }}>
      <AppSidebar
        current={current}
        onNavigate={(href, event) => {
          event.preventDefault();
          setCurrent(href);
        }}
      >
        <AppSidebarHeader>
          <AppSidebarSwitcher app={{ name: "Tasks", icon: Tick01Icon }} />
        </AppSidebarHeader>
        <AppSidebarNav aria-label="Tasks navigation">
          <AppSidebarMenu>
            <AppSidebarItem>
              <AppSidebarLink href="#/inbox" icon={InboxIcon} count={4}>
                Inbox
              </AppSidebarLink>
            </AppSidebarItem>
            <AppSidebarItem>
              <AppSidebarLink href="#/my" icon={UserCircleIcon}>
                My issues
              </AppSidebarLink>
            </AppSidebarItem>
          </AppSidebarMenu>
          <AppSidebarSection label="Workspace">
            <AppSidebarMenu>
              <AppSidebarItem>
                <AppSidebarLink href="#/projects" icon={Folder01Icon}>
                  Projects
                </AppSidebarLink>
              </AppSidebarItem>
            </AppSidebarMenu>
          </AppSidebarSection>
        </AppSidebarNav>
        <AppSidebarFooter>Help</AppSidebarFooter>
      </AppSidebar>
    </div>
  );
}
