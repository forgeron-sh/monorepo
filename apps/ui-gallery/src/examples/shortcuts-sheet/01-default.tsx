import {
  Button,
  ShortcutsSheet,
  ShortcutsSheetContent,
  ShortcutsSheetFooter,
  ShortcutsSheetSearch,
  ShortcutsSheetSections,
  type Action,
} from "@forgeron/ui";
import { useState } from "react";

const actions: Action[] = [
  { id: "undo", label: "Undo", shortcut: "mod+z", group: "Edit" },
  { id: "redo", label: "Redo", shortcut: "mod+shift+z", group: "Edit" },
  { id: "dup", label: "Duplicate", shortcut: "mod+d", group: "Edit", keywords: ["copy", "clone"] },
  { id: "del", label: "Delete", shortcut: "backspace", group: "Edit" },
  { id: "select", label: "Select", shortcut: "v", group: "Tools" },
  { id: "rect", label: "Rectangle", shortcut: "r", group: "Tools" },
  { id: "text", label: "Text", shortcut: "t", group: "Tools" },
  { id: "zoom-in", label: "Zoom in", shortcut: "mod+=", group: "View" },
  { id: "zoom-out", label: "Zoom out", shortcut: "mod+-", group: "View" },
  { id: "fit", label: "Zoom to fit", shortcut: "shift+1", group: "View" },
];

export default function Default() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button kbd="?" onClick={() => setOpen(true)}>
        Keyboard shortcuts
      </Button>
      <ShortcutsSheet
        actions={actions}
        open={open}
        onOpenChange={setOpen}
        entries={[
          {
            id: "pan",
            label: "Pan",
            keys: ["Space", "drag"],
            group: "View",
            keywords: ["move", "hand"],
          },
          { id: "zoom-wheel", label: "Zoom", keys: ["⌘", "scroll"], group: "View" },
        ]}
        sectionOrder={["Tools", "Edit", "View"]}
        footer="Press ? any time to open this sheet."
      >
        <ShortcutsSheetContent title="Keyboard shortcuts">
          <ShortcutsSheetSearch />
          <ShortcutsSheetSections />
          <ShortcutsSheetFooter />
        </ShortcutsSheetContent>
      </ShortcutsSheet>
    </>
  );
}
