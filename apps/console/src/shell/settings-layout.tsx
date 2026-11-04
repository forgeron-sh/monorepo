import { Nav, Sidebar, type NavItem } from "@forgeron/ui";
import type { WorkspaceInfo } from "../workspace";
import { canSee } from "./access";
import { ChromeShell, GROUP_NAMES, SearchButton, type LayoutProps } from "./app-layout";
import { PersonMenu } from "./chrome";
import { routes, type RouteDef } from "./routes";

// The settings area: its own sidebar with a way back to the app, then the pages of every group a person
// may use, built from the routes that carry `settings`.

const Back = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const groupItems = (
  ws: WorkspaceInfo,
  pathname: string,
  group: keyof typeof GROUP_NAMES,
): NavItem[] =>
  routes
    .filter(
      (r): r is RouteDef & { settings: NonNullable<RouteDef["settings"]> } =>
        r.settings?.group === group && canSee(r.access, ws.person),
    )
    .map((r) => ({
      id: r.path,
      label: r.settings.label,
      href: r.path,
      current: pathname === r.path,
    }));

export function SettingsLayout({ ws, pathname, go, children }: LayoutProps) {
  return (
    <ChromeShell
      ws={ws}
      pathname={pathname}
      go={go}
      sidebar={({ openSearch }) => (
        <Sidebar
          header={
            <Nav
              label="Back"
              items={[{ id: "back", label: "Back to app", href: "/", icon: <Back /> }]}
              onNavigate={(href) => go(href)}
            />
          }
          footer={<PersonMenu ws={ws} go={go} />}
        >
          <SearchButton onClick={openSearch} />
          {(Object.keys(GROUP_NAMES) as Array<keyof typeof GROUP_NAMES>).map((group) => {
            const items = groupItems(ws, pathname, group);
            return items.length ? (
              <Nav
                key={group}
                label={`Settings, ${GROUP_NAMES[group]}`}
                heading={GROUP_NAMES[group]}
                items={items}
                onNavigate={(href) => go(href)}
              />
            ) : null;
          })}
        </Sidebar>
      )}
    >
      {children}
    </ChromeShell>
  );
}
