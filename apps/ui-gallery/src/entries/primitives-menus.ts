import type { Atom } from "../types";

/** Gallery entries of components moved from the blocks into the primitives (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "command-palette",
    name: "Command palette",
    summary:
      "⌘K: search pages, records and actions, arrows and Enter to run. Composed from parts, with a props shorthand.",
    imports: [
      "CommandPalette",
      "CommandEmpty",
      "CommandGroup",
      "CommandInput",
      "CommandItem",
      "CommandList",
      "CommandSeparator",
      "CommandShortcut",
      "filterCommands",
    ],
    props: [
      {
        name: "Command parts",
        type: "CommandDialog, Command, CommandInput (end), CommandList, CommandGroup, CommandItem…",
        description:
          "CommandPalette is built from them: compose your own as shadcn's docs do (D-157).",
      },
      {
        name: "no groups",
        type: "CommandDialogProps",
        description:
          "Without groups, CommandPalette is the root of the Command parts, in a dialog (D-157).",
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
    summary:
      "The actions on a record behind “…” or a right click, with submenus. Composed from parts, with a props shorthand.",
    imports: [
      "ActionMenu",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuSeparator",
      "DropdownMenuShortcut",
      "DropdownMenuSub",
      "DropdownMenuSubContent",
      "DropdownMenuSubTrigger",
      "DropdownMenuTrigger",
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
      {
        name: "no items",
        type: "open / defaultOpen / onOpenChange",
        description:
          "Without items, ActionMenu is the root of the DropdownMenu parts: DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub… (D-156).",
      },
    ],
  },
  {
    slug: "menu",
    name: "Menu",
    summary:
      "A button that opens links, actions and one-of-many choices. Composed from parts, with a props shorthand.",
    imports: [
      "Menu",
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuLabel",
      "DropdownMenuSeparator",
    ],
    props: [
      {
        name: "no entries",
        type: "open / defaultOpen / onOpenChange",
        description: "Without entries, Menu is the root of the DropdownMenu parts (D-156).",
      },
      {
        name: "entries",
        type: "MenuEntry[]",
        description:
          "{ kind: link | action | radio | heading | text | separator, label, … }; consecutive radios form one choice.",
      },
      { name: "trigger", type: "ReactNode", description: "What the button shows." },
      { name: "label", type: "string", description: "Names the button and the menu." },
      {
        name: "placement / align",
        type: "below | above / start | center | end",
        default: "below / start",
        description: "Where it opens against the button.",
      },
    ],
  },
  {
    slug: "modal",
    name: "Modal",
    summary:
      "A modal over the page with its context, title and close button. Composed from parts, with a props shorthand.",
    imports: [
      "Modal",
      "ModalContent",
      "ModalHeader",
      "ModalContext",
      "ModalTitle",
      "ModalClose",
      "DialogTrigger",
    ],
    props: [
      {
        name: "no title",
        type: "open / defaultOpen / onOpenChange",
        description:
          "Without title, Modal is the root of its parts: ModalContent (size), ModalHeader, ModalContext, ModalTitle, ModalClose; DialogTrigger opens it.",
      },
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlled." },
      { name: "title", type: "ReactNode", description: "Its accessible name." },
      { name: "context", type: "ReactNode", description: "Before the title: a team chip." },
      { name: "trigger", type: "ReactElement", description: "A button that opens it." },
      { name: "size", type: "sm | md", default: "md", description: "480px or 750px." },
      { name: "initialFocus", type: "RefObject", description: "Takes focus on open." },
    ],
  },
];
