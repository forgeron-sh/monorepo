import type { Atom } from "../types";

const className = { name: "className", type: "string", description: "Extra classes." };

/** Gallery pages of the "filtering" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "list-view",
    name: "List view",
    summary:
      "The reference screen: header, layouts, filters, display, palette and shortcuts, put together with the hooks.",
    imports: [
      "useListView",
      "useActions",
      "useDisclosure",
      "ViewHeader",
      "LayoutSwitch",
      "FilterMenu",
      "FilterBar",
      "DisplayMenu",
      "IssueList",
      "IssueBoard",
      "CommandPalette",
    ],
    props: [
      {
        name: "useListView(records, spec, { defaultDisplay })",
        type: "ListView<T>",
        description:
          "The state: filters, display, setLayout, and the records filtered, ordered and grouped.",
      },
      {
        name: "spec.read / groupings / orderings",
        type: "ViewSpec<T>",
        description:
          "How to read a record for the filters, the groupings by id (key, order, name), the orderings by id.",
      },
      {
        name: "LAYOUTS",
        type: "DisplayLayout[]",
        description:
          "List, Board, then any layout the app adds (MORE_LAYOUTS.timeline, .calendar), each with its kbd.",
      },
      {
        name: "RENDER",
        type: "Record<layout, () => ReactNode>",
        description:
          "One renderer per layout: adding a layout is one entry here and one in LAYOUTS.",
      },
      {
        name: "useActions([...])",
        type: "Actions",
        description:
          "New issue (C), Filter (F), Display (V), the layouts (⇧L ⇧B ⇧T ⇧C) and ⌘K, once for the palette and the keys.",
      },
    ],
  },
  {
    slug: "filter-bar",
    name: "Filter bar",
    summary:
      "The filters of a list as chips: field, is or is not, values, ×. A Filter button adds one.",
    imports: ["FilterBar", "FilterMenu", "matchesFilters", "type Filter", "type FilterField"],
    props: [
      {
        name: "fields",
        type: "FilterField[]",
        description:
          "What can be filtered: { id, label, icon, options: { value, label, glyph?, hint? }[] }.",
      },
      {
        name: "value",
        type: "Filter[]",
        description:
          "The filters set, one per field: { field, operator: 'is' | 'is-not', values }.",
      },
      {
        name: "onChange",
        type: "(value: Filter[]) => void",
        description: "Called with the new list when a value, an operator or a chip changes.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "FilterBar: controls after Clear, e.g. Save as view.",
      },
      {
        name: "variant",
        type: `"button" | "icon"`,
        default: `"button"`,
        description: "FilterMenu: the Filter button, or a square + for the end of a bar.",
      },
      {
        name: "label",
        type: "string",
        default: `"Filter"`,
        description: "FilterMenu: the words of the button.",
      },
      className,
    ],
  },
  {
    slug: "display-menu",
    name: "Display menu",
    summary:
      "How a view shows: its layouts, grouping, ordering, switches, properties. Built from props, or composed from parts.",
    imports: [
      "DisplayMenu",
      "DisplayLayouts",
      "DisplaySelect",
      "DisplayToggle",
      "DisplayProperties",
      "DisplaySection",
      "DisplayWhen",
      "DisplayReset",
      "MORE_LAYOUTS",
      "type DisplayOptions",
    ],
    props: [
      {
        name: "value",
        type: "DisplayOptions",
        description:
          "{ layout, grouping, ordering, toggles: Record<id, boolean>, properties: id[], options?: Record<name, string> }.",
      },
      {
        name: "onChange",
        type: "(value: DisplayOptions) => void",
        description: "Called on every change; changes apply at once.",
      },
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in any order: DisplayLayouts, DisplaySelect (grouping, ordering, or any name kept in options), DisplayToggle, DisplayProperties, DisplaySection, DisplayWhen layout=…, DisplayReset. Without children the props below build the usual menu.",
      },
      {
        name: "open / onOpenChange",
        type: "boolean / (open) => void",
        description: "Opens the menu from outside, e.g. from the V shortcut (useDisclosure).",
      },
      {
        name: "groupings",
        type: "SelectMenuOption[]",
        description: "The ways to group rows: Status, Assignee, No grouping.",
      },
      {
        name: "orderings",
        type: "SelectMenuOption[]",
        description: "The ways to order rows: Priority, Due date, Updated.",
      },
      {
        name: "toggles",
        type: "{ id, label }[]",
        default: "[]",
        description: "Switches such as Show sub-issues, Show empty groups.",
      },
      {
        name: "properties",
        type: "{ id, label }[]",
        default: "[]",
        description: "The properties a row can show, toggled as chips.",
      },
      {
        name: "layouts",
        type: "{ value, label, icon?, kbd? }[]",
        default: "List, Board",
        description: "The layout switch; [] hides it.",
      },
      {
        name: "defaultValue",
        type: "DisplayOptions",
        description: "Offers Reset to default when the value differs from it.",
      },
      {
        name: "label",
        type: "string",
        default: `"Display"`,
        description: "The words of the button.",
      },
      className,
    ],
  },
  {
    slug: "view-header",
    name: "View header",
    summary: "The bar above a list: title, view tabs, then filter, display and the main action.",
    imports: ["ViewHeader", "LayoutSwitch"],
    props: [
      {
        name: "breadcrumb",
        type: "BreadcrumbItem[]",
        description: "Where the view sits; takes the place of the title.",
      },
      { name: "title", type: "ReactNode", description: "The name of the view." },
      {
        name: "tabs",
        type: "{ value, label, count?, href? }[]",
        default: "[]",
        description: "The views; the count shows on the current tab only. href makes links.",
      },
      { name: "tab", type: "string", description: "The current tab's value." },
      {
        name: "onTabChange",
        type: "(value: string) => void",
        description: "Called when a tab without href is chosen.",
      },
      { name: "filter", type: "ReactNode", description: "The filter button: a FilterMenu." },
      {
        name: "switcher",
        type: "ReactNode",
        description: "The layouts as icons before the filter: a LayoutSwitch.",
      },
      { name: "display", type: "ReactNode", description: "The display button: a DisplayMenu." },
      {
        name: "action",
        type: "ReactNode",
        description: "The main action: a primary Button such as New issue, with its kbd.",
      },
      className,
    ],
  },
];
