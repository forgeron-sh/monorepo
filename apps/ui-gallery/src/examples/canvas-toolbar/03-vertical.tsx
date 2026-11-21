import { Cursor02Icon, Eraser01Icon, HandIcon, Pen01Icon, StickyNote02Icon } from "@forgeron/icons";
import { CanvasToolbar } from "@forgeron/ui";

const tools = [
  { id: "select", label: "Select", icon: Cursor02Icon, shortcut: "v" },
  { id: "hand", label: "Hand", icon: HandIcon, shortcut: "h" },
  { id: "pen", label: "Pen", icon: Pen01Icon, shortcut: "p", group: "draw" },
  {
    id: "eraser",
    label: "Eraser",
    icon: Eraser01Icon,
    shortcut: "e",
    group: "draw",
    disabled: true,
  },
  { id: "note", label: "Sticky note", icon: StickyNote02Icon, shortcut: "n", group: "draw" },
];

export default function Vertical() {
  return (
    <CanvasToolbar
      label="Board tools"
      orientation="vertical"
      floating
      tools={tools}
      defaultValue="select"
      onUndo={() => {}}
      onRedo={() => {}}
      canRedo={false}
      shortcuts={false}
    />
  );
}
