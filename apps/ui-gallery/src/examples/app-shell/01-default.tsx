import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Nav,
  NavBadge,
  NavLabel,
  NavLink,
  NavList,
  NavListItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@forgeron/ui";
import { useState } from "react";

// The same shell as the first example, from its parts: the header, the sidebar and the main of the
// shell, then a sidebar of header, groups of menus and footer, and a nav of links.
export default function Composed() {
  const [page, setPage] = useState("home");
  return (
    <div style={{ width: 340, height: 280, border: "1px solid var(--line)" }}>
      <AppShell frame="box" contentId="demo-shell-composed" defaultMenuOpen>
        <AppShellHeader>
          <b>Console</b>
        </AppShellHeader>
        <AppShellSidebar>
          <Sidebar>
            <SidebarHeader>
              <b>Maison Roy</b>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarMenu>
                  {["home", "tools"].map((id) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton asChild isActive={page === id}>
                        <a
                          href={`#/${id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(id);
                          }}
                        >
                          {id === "home" ? "Home" : "Tools"}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
              <Nav label="Account">
                <NavList>
                  <NavListItem>
                    <NavLink href="#/approvals">
                      <NavLabel>Approvals</NavLabel>
                      <NavBadge>2</NavBadge>
                    </NavLink>
                  </NavListItem>
                </NavList>
              </Nav>
            </SidebarContent>
            <SidebarFooter>Ada</SidebarFooter>
          </Sidebar>
        </AppShellSidebar>
        <AppShellMain>
          <div style={{ padding: 16 }}>{page === "home" ? "Home" : "Tools"}</div>
        </AppShellMain>
      </AppShell>
    </div>
  );
}
