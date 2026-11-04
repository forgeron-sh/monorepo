import { Avatar, Logo, Menu, type MenuEntry } from "@forgeron/ui";
import type { WorkspaceInfo } from "../workspace";
import { THEMES, useThemePreference } from "./theme";

// The two menus of the sidebar: the workspace switcher on top, the person's menu at the bottom.

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const DOCUMENTATION_URL = "https://forgeron.app";

export function WorkspaceSwitcher({ ws, go }: { ws: WorkspaceInfo; go: (href: string) => void }) {
  // A workspace is one install: the person belongs to this one. Others would be listed here.
  const entries: MenuEntry[] = [
    { kind: "heading", label: "Workspaces" },
    { kind: "radio", label: ws.workspace, checked: true, onSelect: () => {} },
    ...(ws.person.admin
      ? ([
          { kind: "separator" },
          {
            kind: "link",
            label: "Workspace settings",
            href: "/settings/workspace",
            onSelect: go,
          },
          { kind: "link", label: "Invite people", href: "/settings/members?invite", onSelect: go },
        ] satisfies MenuEntry[])
      : []),
  ];
  return (
    <Menu
      label="Workspace"
      entries={entries}
      trigger={
        <>
          <Logo variant="symbol" size={20} />
          <span className="fc-trigger-name" title={ws.workspace}>
            {ws.workspace}
          </span>
          <Chevron />
        </>
      }
    />
  );
}

export function PersonMenu({ ws, go }: { ws: WorkspaceInfo; go: (href: string) => void }) {
  const [theme, setTheme] = useThemePreference();
  const name =
    ws.person.name && ws.person.name !== ws.person.email ? ws.person.name : ws.person.email;
  const entries: MenuEntry[] = [
    { kind: "text", label: ws.person.email },
    { kind: "link", label: "Profile", href: "/settings/profile", onSelect: go },
    { kind: "separator" },
    { kind: "heading", label: "Theme" },
    ...THEMES.map(
      (t) =>
        ({
          kind: "radio",
          label: t.label,
          checked: theme === t.id,
          onSelect: () => setTheme(t.id),
        }) satisfies MenuEntry,
    ),
    { kind: "separator" },
    { kind: "link", label: "Documentation", href: DOCUMENTATION_URL },
    { kind: "link", label: "Sign out", href: "/auth/logout" },
  ];
  return (
    <Menu
      label="Your account"
      placement="above"
      entries={entries}
      trigger={
        <>
          <Avatar name={name} />
          <span className="fc-trigger-name" title={ws.person.email}>
            {name}
          </span>
          <Chevron />
        </>
      }
    />
  );
}
