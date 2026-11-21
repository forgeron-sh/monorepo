import {
  CheckmarkSquare01Icon,
  Edit02Icon,
  Folder01Icon,
  InboxIcon,
  Layers01Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@forgeron/icons";
import {
  Button,
  CommandPalette,
  StatusGlyph,
  Swatch,
  type CommandPaletteGroup,
} from "@forgeron/ui";
import { useState } from "react";

const groups: CommandPaletteGroup[] = [
  {
    label: "Go to",
    items: [
      { id: "#/inbox", label: "Inbox", icon: InboxIcon, kbd: ["G", "I"] },
      { id: "#/my", label: "My issues", icon: UserCircleIcon, kbd: ["G", "M"] },
      { id: "#/team/OPS/issues", label: "Operations issues", icon: CheckmarkSquare01Icon },
      { id: "#/projects", label: "Projects", icon: Folder01Icon },
      { id: "#/views", label: "Views", icon: Layers01Icon },
    ],
  },
  {
    label: "Actions",
    items: [
      { id: "new", label: "New issue", icon: Edit02Icon, kbd: "C", keywords: ["create"] },
      { id: "invite", label: "Invite people", icon: UserGroupIcon, keywords: ["members"] },
    ],
  },
  {
    label: "Projects",
    items: [
      { id: "#/project/portal", label: "Supplier portal", glyph: <Swatch color="var(--accent)" /> },
      {
        id: "#/project/carriers",
        label: "Carrier rates 2027",
        glyph: <Swatch color="var(--success)" />,
      },
    ],
  },
  {
    label: "Issues",
    items: [
      {
        id: "OPS-40",
        label: "Supplier invoices arrive twice from Odoo",
        hint: "OPS-40",
        glyph: <StatusGlyph status="progress" />,
      },
      {
        id: "OPS-31",
        label: "Supplier portal: sign-in with an expired invite",
        hint: "OPS-31",
        glyph: <StatusGlyph status="todo" />,
      },
      {
        id: "OPS-34",
        label: "Carrier rates: import the new grid",
        hint: "OPS-34",
        glyph: <StatusGlyph status="review" />,
      },
      {
        id: "OPS-22",
        label: "Fire exit signage audit",
        hint: "OPS-22",
        glyph: <StatusGlyph status="todo" />,
      },
    ],
  },
];

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Button kbd="/" onClick={() => setOpen(true)}>
        Search issues, projects, pages
      </Button>
      <span style={{ color: "var(--ink-dim)", font: "400 12px/1 var(--font-mono)" }}>
        {last ? `Ran ${last}` : "Arrows, Enter, Esc"}
      </span>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        onSelect={setLast}
        placeholder="Search issues, projects, pages…"
        shortcut="/"
      />
    </div>
  );
}
