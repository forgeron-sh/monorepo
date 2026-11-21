import type { Atom } from "../types";

/** Gallery entry of the Sortable primitive, extracted from the blocks that reorder (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "sortable",
    name: "Sortable",
    summary:
      "A list that reorders by drag and by keyboard: Alt + arrows move the focused item, the focus follows it, every move is said in a live region.",
    imports: [
      "Sortable",
      "SortableItem",
      "SortableHandle",
      "SortableDropIndicator",
      "SortableStatus",
      "useSortable",
    ],
    props: [
      {
        name: "Sortable",
        type: "ul",
        description:
          "The list. `items` (controlled) or `defaultItems`, `getId` (default: `item.id`), `onReorder(next, move)`. Children are `SortableItem`s, or a function from an item to one. `render={<ol />}` draws another element. A live region follows the list unless `status={false}`.",
      },
      {
        name: "label / orientation",
        type: `string / "vertical" | "horizontal"`,
        default: `"vertical"`,
        description:
          "`label` names the list for assistive technology. The orientation picks the arrows (Up and Down, or Left and Right) and the half of an item that means before.",
      },
      {
        name: "handle",
        type: "boolean",
        default: "false",
        description:
          "Only a `SortableHandle` drags; otherwise the whole item does. A drag that starts elsewhere in the item is not a drag.",
      },
      {
        name: "disabled",
        type: "boolean | (id: string) => boolean",
        description: "Items that stay where they are: no drag, no Alt + arrows.",
      },
      {
        name: "range",
        type: "[min: number, max: number]",
        description: "The indexes an item may reach, both included: a first item that stays first.",
      },
      {
        name: "canDrop",
        type: "(id, overId, position) => boolean",
        description:
          "Whether a drop here is accepted. A refused drop shows no mark and moves nothing.",
      },
      {
        name: "navigate / homeEnd",
        type: "boolean",
        description:
          "`navigate`: plain arrows move the focus between items. `homeEnd`: Alt + Home and Alt + End move to the ends.",
      },
      {
        name: "getLabel / announce",
        type: "(item) => string / (move, item, count) => string | null",
        description:
          'What an item is called, and the words after a move (default: "Moved Status to position 3 of 5").',
      },
      {
        name: "onItemDrop / nest / nestRange / pointer",
        type: "(drop) => void / (id) => boolean / [number, number] / boolean",
        description:
          "For trees: `onItemDrop({ id, overId, position })` takes the drop in place of the reorder, with `before`, `after` or, on items `nest` accepts, `inside`.",
      },
      {
        name: "SortableItem",
        type: "{ id, render? } & li props",
        description:
          "One item. `data-dragging` while held, `data-over` (before, after, inside) while under the pointer. Your own `onKeyDown`, `onDragOver`… run first and can `preventDefault()` to skip ours.",
      },
      {
        name: "SortableHandle",
        type: "span",
        description:
          "The grip an item is dragged by. Hidden from assistive technology: the keyboard moves the item itself.",
      },
      {
        name: "SortableDropIndicator",
        type: "span",
        description: "The line where a drop would land, drawn in the item under the pointer.",
      },
      {
        name: "SortableStatus",
        type: "span",
        description: "The live region, for a list that draws its own place for it.",
      },
      {
        name: "useSortable",
        type: "(options) => { getListProps, getItemProps, getHandleProps, getItemState, moveTo, announce, status… }",
        description:
          "The hook behind the parts, for rows of your own: spread the getters on your elements and hold the order yourself.",
      },
    ],
  },
];
