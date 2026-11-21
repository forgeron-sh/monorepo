import { AppShell, Nav, Sidebar } from "@forgeron/ui";
import { useState } from "react";

// A shell in a narrow frame: the sidebar folds behind the menu button. It starts open here.
export default function Default() {
  const [menuOpen, setMenuOpen] = useState(true);
  return (
    <div style={{ width: 340, height: 220, border: "1px solid var(--line)" }}>
      <AppShell
        frame="box"
        contentId="demo-shell-1"
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        topbar={<b>Console</b>}
        sidebar={
          <Sidebar header={<b>Maison Roy</b>}>
            <Nav
              label="Main"
              items={[
                { id: "home", label: "Home", href: "#/", current: true },
                { id: "tools", label: "Tools", href: "#/tools" },
                { id: "people", label: "People", href: "#/people" },
              ]}
              onNavigate={() => setMenuOpen(false)}
            />
          </Sidebar>
        }
      >
        <div style={{ padding: 16 }}>Home</div>
      </AppShell>
    </div>
  );
}
