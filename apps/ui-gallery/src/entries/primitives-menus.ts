import type { Atom } from "../types";

/** Gallery entries of components moved from the blocks into the primitives (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "command-palette",
    name: "Command palette",
    summary: "⌘K: search pages, records and actions, arrows and Enter to run.",
    imports: ["CommandPalette", "filterCommands"],
    props: [
      {
        name: "Command parts",
        type: "CommandDialog, Command, CommandInput (end), CommandList, CommandGroup, CommandItem…",
        description:
          "CommandPalette is built from them: compose your own as shadcn's docs do (D-157).",
      },
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlled." },
      {
        name: "groups",
        type: "{ label, items: { id, label, icon?, glyph?, hint?, kbd?, keywords? }[] }[]",
        description: "The results, by group; filtered on label, hint and keywords.",
      },
      { name: "onSelect", type: "(id: string) => void", description: "The row run; then closes." },
      {
        name: "placeholder",
        type: "string",
        default: `"Search or run a command…"`,
        description: "In the field.",
      },
      {
        name: "shortcut",
        type: "string | string[]",
        default: `["⌘", "K"]`,
        description: "The key that opens it, at the end of the field.",
      },
      {
        name: "emptyText",
        type: "(query) => ReactNode",
        description: "When nothing matches; No results for “…” by default.",
      },
    ],
  },
  {
    slug: "action-menu",
    name: "Action menu",
    summary: "The actions on a record behind “…” or a right click, with submenus.",
    imports: [
      "ActionMenu",
      "ContextMenu",
      "ContextMenuTrigger",
      "ContextMenuContent",
      "ContextMenuItem",
      "ContextMenuLabel",
      "ContextMenuSeparator",
      "ContextMenuShortcut",
      "ContextMenuGroup",
      "ContextMenuCheckboxItem",
      "ContextMenuRadioGroup",
      "ContextMenuRadioItem",
      "ContextMenuSub",
      "ContextMenuSubTrigger",
      "ContextMenuSubContent",
    ],
    props: [
      {
        name: "ContextMenu parts",
        type: "ContextMenuTrigger, ContextMenuContent, ContextMenuItem (variant, inset), ContextMenuLabel, ContextMenuSeparator…",
        description: "Without items, ContextMenu is shadcn's root, as the dropdown menu (D-156).",
      },
      {
        name: "items",
        type: "ActionMenuEntry[]",
        description:
          "{ id, label, icon?, glyph?, kbd?, danger?, checked?, items? }, { separator: true }, { heading }.",
      },
      {
        name: "onSelect",
        type: "(id: string) => void",
        description: "The row chosen, in the menu or a submenu.",
      },
      {
        name: "trigger",
        type: "ReactElement",
        description: "ActionMenu: the control that opens it, e.g. an IconButton.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "ContextMenu: the area that opens it on right click.",
      },
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Optional." },
      { name: "label", type: "string", description: "Names the menu, e.g. Actions on OPS-40." },
    ],
  },
];
