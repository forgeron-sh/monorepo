// Blocks of the "navigation" group, after the Tasks prototype. Each block lives in its own file next to
// this one; this barrel re-exports them.

export { InboxList } from "./navigation-inbox-list";
export type { InboxItem, InboxListProps } from "./navigation-inbox-list";
export { AppSidebar } from "./navigation-sidebar";
export type {
  AppSidebarApp,
  AppSidebarLink,
  AppSidebarProps,
  AppSidebarSection,
} from "./navigation-sidebar";
