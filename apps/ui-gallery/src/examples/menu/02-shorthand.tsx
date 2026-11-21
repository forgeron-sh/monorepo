import { Menu, type MenuEntry } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [theme, setTheme] = useState("forge");
  const entries: MenuEntry[] = [
    { kind: "text", label: "camille@acme.fr" },
    { kind: "separator" },
    { kind: "heading", label: "Theme" },
    ...["system", "forge", "paper"].map((t): MenuEntry => ({
      kind: "radio",
      label: t,
      checked: theme === t,
      onSelect: () => setTheme(t),
    })),
    { kind: "separator" },
    { kind: "link", label: "Documentation", href: "/docs" },
    { kind: "action", label: "Sign out", tone: "danger", onSelect: () => {} },
  ];
  return <Menu trigger="Camille Roy" label="Account" entries={entries} />;
}
