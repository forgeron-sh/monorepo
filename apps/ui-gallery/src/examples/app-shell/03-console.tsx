import { Home01Icon, PackageIcon, Settings01Icon, UserGroupIcon } from "@forgeron/icons";
import { AppShell, Avatar, Icon, KpiRow, Nav, Page, Sidebar } from "@forgeron/ui";
import { useState } from "react";

const main = [
  { id: "home", label: "Home", href: "#/", icon: Home01Icon },
  { id: "tools", label: "Tools", href: "#/tools", icon: PackageIcon },
  { id: "people", label: "People", href: "#/people", icon: UserGroupIcon },
];
const account = [{ id: "settings", label: "Settings", href: "#/settings", icon: Settings01Icon }];

// A frame of the console: the shell fills its parent here (frame="box"); in an app it fills the
// window. Narrow the window below 640 px of frame and the sidebar folds behind the menu.
export default function Console() {
  const [current, setCurrent] = useState("#/");
  const [menuOpen, setMenuOpen] = useState(false);
  const items = (list: typeof main) =>
    list.map(({ icon, ...item }) => ({
      ...item,
      current: item.href === current,
      icon: <Icon icon={icon} size={12} variant="mono" />,
    }));
  const go = (href: string) => {
    setCurrent(href);
    setMenuOpen(false);
  };
  return (
    <div style={{ width: "100%", height: 420, border: "1px solid var(--line)" }}>
      <AppShell
        frame="box"
        contentId="demo-shell-2"
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        topbar={<b>Maison Roy</b>}
        sidebar={
          <Sidebar
            header={<b>Maison Roy</b>}
            footer={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Avatar name="Camille Roy" size={20} />
                Camille Roy
              </span>
            }
          >
            <Nav label="Main" items={items(main)} onNavigate={go} />
            <Nav label="Account" heading="Account" items={items(account)} onNavigate={go} />
          </Sidebar>
        }
      >
        <Page title="Home" description="The workspace at a glance.">
          <KpiRow
            items={[
              { label: "Runs today", value: "1,204", delta: 0.08, hint: "vs yesterday" },
              { label: "Failed", value: "3", delta: -0.5, better: "down", hint: "vs yesterday" },
              { label: "Members", value: "48" },
            ]}
          />
        </Page>
      </AppShell>
    </div>
  );
}
