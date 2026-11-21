// New names of the "shell" group (D-156): the parts of AppShell, Sidebar, Nav, SplitPane and
// Settings. The roots (AppShell, Sidebar, Nav, SplitPane, SettingsGroup, SettingsRow) are
// exported by index.ts.
export {
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  NavBadge,
  NavHeading,
  NavIcon,
  NavListItem,
  NavLabel,
  NavLink,
  NavList,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./shell";
export type {
  AppShellHeaderProps,
  AppShellMainProps,
  AppShellRootProps,
  AppShellSidebarProps,
  NavHeadingProps,
  NavLabelProps,
  NavLinkProps,
  NavListItemProps,
  NavListProps,
  NavRootProps,
  SidebarGroupLabelProps,
  SidebarHeaderProps,
  SidebarMenuButtonProps,
  SidebarMenuItemProps,
  SidebarMenuProps,
  SidebarProviderProps,
  SidebarTriggerProps,
} from "./shell";
export { SplitPaneHandle, SplitPanePanel } from "./split-pane";
export type { SplitPaneHandleProps, SplitPanePanelProps, SplitPaneRootProps } from "./split-pane";
export {
  SettingsGroupCard,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
  SettingsRowControl,
  SettingsRowDescription,
  SettingsRowLabel,
  SettingsRowText,
  SettingsRowValue,
} from "./settings";
export type {
  SettingsGroupCardProps,
  SettingsGroupHeaderProps,
  SettingsGroupTitleProps,
  SettingsRowControlProps,
  SettingsRowRootProps,
} from "./settings";
