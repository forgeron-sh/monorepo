// shadcn parts of the "collection" group (D-156, D-157). The root is exported as `SelectionBarRoot`
// here: the block of `drive` keeps the name `SelectionBar` (a bar built from `actions`).
export {
  SelectionBar as SelectionBarRoot,
  SelectionBarActions,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarSeparator,
} from "./selection-bar";
export type {
  SelectionBarActionsProps,
  SelectionBarClearProps,
  SelectionBarCountProps,
  SelectionBarProps as SelectionBarRootProps,
} from "./selection-bar";
