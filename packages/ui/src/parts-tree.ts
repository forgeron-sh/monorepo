// shadcn parts of the "tree" group (D-156, D-157). `Tree` is one name for both APIs: with `items`
// it is the props-driven tree, without it the root of the parts. `TreeRoot` is the root alone,
// kept for the code that was written when the two names were apart.
export {
  focusTreeItem,
  Tree,
  /** @deprecated Use `Tree` without `items`: same component. */
  TreeRoot,
  TreeGroup,
  TreeItem,
  TreeItemContent,
  TreeItemIndicator,
  useTree,
  useTreeItem,
} from "./tree";
export type {
  TreeGroupProps,
  TreeItemContentProps,
  TreeItemIndicatorProps,
  TreeItemProps,
  TreeItemsProps,
  TreeMove,
  TreeNode,
  TreePick,
  TreeProps,
  TreeRootProps,
  TreeRowState,
  TreeSelectionMode,
} from "./tree";
