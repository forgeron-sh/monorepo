import type { Atom } from "../types";

/** Gallery pages of the hooks: the state the components share, the keyboard, the actions. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "use-list-view",
    name: "useListView",
    summary:
      "The state of a list view: filters and display options, and the records they select, grouped and ordered.",
    imports: ["useListView", "viewRecords", "type ViewSpec"],
    props: [
      { name: "records", type: "T[]", description: "Every record of the view." },
      {
        name: "spec",
        type: "{ read, groupings?, orderings? }",
        description:
          "read(record, field) for the filters (null matches “_”); groupings by id: { key, order?, name? }; orderings by id: a comparison.",
      },
      {
        name: "defaultDisplay / defaultFilters",
        type: "DisplayOptions / Filter[]",
        description: "Where the view starts, and where Reset to default goes back to.",
      },
      {
        name: "returns",
        type: "ListView<T>",
        description:
          "filters, setFilters, display, setDisplay, setLayout, records, groups, defaultDisplay. A showEmptyGroups toggle keeps empty groups. viewRecords does the same without React.",
      },
    ],
  },
  {
    slug: "use-actions",
    name: "useActions",
    summary:
      "Declare a screen's actions once: the … menu, the right click, the palette and the keys follow.",
    imports: ["useActions", "buildMenu", "buildCommands", "type Action"],
    props: [
      {
        name: "actions",
        type: "Action[]",
        description:
          "{ id, label, icon?, glyph?, shortcut?, group?, keywords?, danger?, disabled?, checked?, run?, actions? }: actions under actions become a submenu.",
      },
      {
        name: "options.shortcuts",
        type: "boolean",
        default: "true",
        description: "Binds the shortcuts on the page; off where several records share a page.",
      },
      {
        name: "returns",
        type: "{ run, menu, commands }",
        description:
          "run(id) for onSelect; menu for ActionMenu and ContextMenu (groups apart, danger last); commands for CommandPalette (choices read “Status: Done”).",
      },
    ],
  },
  {
    slug: "use-shortcuts",
    name: "useShortcuts",
    summary: "Keys bound while a component is shown, silent while typing or inside a menu.",
    imports: ["useShortcuts", "matchShortcut", "formatShortcut"],
    props: [
      {
        name: "bindings",
        type: "Record<combo, (event) => void>",
        description: "Combos read “f”, “shift+b”, “mod+k”; mod is ⌘ on a Mac, Ctrl elsewhere.",
      },
      { name: "options.enabled", type: "boolean", default: "true", description: "Turns them off." },
      {
        name: "formatShortcut(combo)",
        type: "string[]",
        description: "The caps for Kbd: “mod+shift+k” gives ⌘ ⇧ K.",
      },
    ],
  },
  {
    slug: "use-disclosure",
    name: "useDisclosure",
    summary:
      "Open or closed, for a menu, a popover, a dialog or the palette, from a button or a key.",
    imports: ["useDisclosure"],
    props: [
      {
        name: "options",
        type: "{ open?, defaultOpen?, onOpenChange? }",
        description: "Controlled or not, like the components.",
      },
      {
        name: "returns",
        type: "Disclosure",
        description:
          "open, setOpen, onOpen, onClose, toggle, and props: { open, onOpenChange } to spread.",
      },
    ],
  },
  {
    slug: "use-controllable-state",
    name: "useControllableState",
    summary: "The value / defaultValue / onChange pattern of every component, for your own.",
    imports: ["useControllableState"],
    props: [
      {
        name: "options",
        type: "{ value?, defaultValue, onChange? }",
        description: "value given: the caller owns it. Absent: the component keeps its own.",
      },
      {
        name: "returns",
        type: "[value, setValue]",
        description:
          "setValue takes a value or a function of the current one; onChange hears real changes only.",
      },
    ],
  },
];
