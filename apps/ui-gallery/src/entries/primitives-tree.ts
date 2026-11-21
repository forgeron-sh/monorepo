import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };

/** Gallery entry of the Tree primitive, extracted from the four tree blocks, and the one `Tree` with `items` (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "tree",
    name: "Tree",
    summary:
      "A tree for any node (pages, folders, teams): arrows, selection, lazy children, drag to reorder, Alt + arrows, F2 rename.",
    imports: ["Tree", "structureMove", "structureShift"],
    props: [
      {
        name: "items",
        type: "TreeNode<D>[]",
        description:
          "{ id, label, icon?, count?, badge?, children?, hasChildren?, disabled?, readOnly?, data? }. hasChildren without children: loaded on first opening.",
      },
      {
        name: "expanded / defaultExpanded / onExpandedChange",
        type: "string[]",
        description: "The open nodes.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string[]",
        description: "The selection. ⌘ click toggles, ⇧ click and ⇧ arrows extend, Space toggles.",
      },
      {
        name: "selectionMode",
        type: `"single" | "multiple" | "none"`,
        default: `"single"`,
        description: "none: focus only.",
      },
      { name: "onActivate", type: "(id) => void", description: "Enter or a double click." },
      {
        name: "onLoadChildren",
        type: "(id) => void | Promise",
        description:
          "First opening of a node with hasChildren and no children; a promise shows the wait.",
      },
      {
        name: "renderItem",
        type: "(node, state) => ReactNode",
        description:
          "What a row shows in place of its label: state is { level, expanded, selected, focused, query }. The icon, count and rename stay.",
      },
      {
        name: "onMove",
        type: "(move) => void",
        description:
          "{ ids, parentId, index, items }: a drag or Alt + arrows moved nodes. It turns both on; keep items from the move. The drop line shows before, inside (dashed) or after; a closed node opens after 700 ms under the pointer.",
      },
      {
        name: "canDrop",
        type: "(ids, targetId, zone) => boolean",
        description: "Refuses a drop. A node is never dropped into itself.",
      },
      {
        name: "onRename / renaming / onRenamingChange",
        type: "(id, label) => void; string | null",
        description:
          "F2 edits the label in place: Enter commits, Escape cancels. Set renaming from a menu action.",
      },
      {
        name: "menu / onAction",
        type: "(ids) => ActionMenuEntry[]; (actionId, ids) => void",
        description: "The actions of the selection behind a right click. Give useActions(…).menu.",
      },
      {
        name: "filter",
        type: "string",
        description:
          "Keeps the nodes whose label holds the text, marks it and opens the way to them.",
      },
      { name: "empty", type: "ReactNode", description: "Shown when nothing is left." },
      { name: "label", type: "string", default: `"Tree"`, description: "Names the tree." },
      className,
    ],
  },
  {
    slug: "tree-parts",
    name: "Tree parts",
    summary:
      "A tree of rows that open and close, with the WAI-ARIA tree keys: arrows, Home, End, * and typeahead.",
    imports: ["Tree", "TreeItem", "TreeItemContent", "TreeItemIndicator", "TreeGroup"],
    props: [
      {
        name: "Tree",
        type: "ul",
        description:
          "The root: `Tree` without `items`. With `items`, `Tree` is the props-driven tree (the Tree page). `render={<div />}` draws another element.",
      },
      {
        name: "expanded / defaultExpanded / onExpandedChange",
        type: "string[] / (ids: string[]) => void",
        description: "The ids of the open items, controlled or not.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string[] / (ids: string[]) => void",
        description: "The ids of the selected items, controlled or not.",
      },
      {
        name: "selectionMode",
        type: `"none" | "single" | "multiple"`,
        default: `"single"`,
        description:
          "multiple: Space toggles, Cmd/Ctrl click toggles, Shift click and Shift + arrows extend, Cmd/Ctrl A takes all.",
      },
      {
        name: "onActivate",
        type: "(id: string) => void",
        description: "Enter on an item that is not disabled, after it is selected.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Names the tree for assistive technology.",
      },
      {
        name: "TreeItem",
        type: "{ id, textValue?, disabled?, hasChildren?, level?, setSize?, position?, pickOnClick?, render? }",
        description:
          "One node; `id` names it for the tree (not the DOM id). `textValue` is what typeahead matches. `hasChildren` says it for children that load on opening; `level`, `setSize` and `position` for a flat list. Takes any li prop: drag handlers, data attributes.",
      },
      {
        name: "TreeItemContent",
        type: "{ indicator?, asChild? } & div props",
        description:
          "The row: indented by level, the chevron before your content, a click that focuses and selects. `preventDefault()` in `onClick` skips the pick. Takes any div prop.",
      },
      {
        name: "TreeItemIndicator",
        type: "span",
        description: "The chevron, drawn by TreeItemContent; give children for your own mark.",
      },
      {
        name: "TreeGroup",
        type: "ul",
        description: "The children of an item: drawn while the item is open.",
      },
      {
        name: "useTree / useTreeItem",
        type: "() => { expanded, selected, toggle, select, focus… }",
        description: "The state and actions, for a part of your own inside the tree.",
      },
    ],
  },
];
