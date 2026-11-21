// Parts of the "views of data" group (D-157): Diff, FieldDiff, VersionCompare, ToolCard,
// DetailList and Board. The roots (DiffView, FieldDiff, VersionCompare, ToolCard, DetailList,
// Board) are exported by index.ts and take both forms.
export {
  DiffBar,
  DiffFold,
  DiffHunk,
  DiffLine,
  DiffSame,
  DiffSplitLine,
  DiffTable,
  FieldDiffRow,
  FieldDiffTable,
  VersionCompareItem,
  VersionCompareList,
  VersionCompareView,
} from "./diff";
export type {
  DiffLineProps,
  DiffSplitSide,
  DiffViewRootProps,
  FieldDiffRootProps,
  VersionCompareRootProps,
} from "./diff";
export {
  DetailListItem,
  DetailListTerm,
  DetailListValue,
  ToolCardDescription,
  ToolCardFooter,
  ToolCardHeader,
  ToolCardHeading,
  ToolCardIcon,
  ToolCardLink,
  ToolCardMeta,
  ToolCardTitle,
} from "./tool-card";
export type {
  DetailListRootProps,
  ToolCardIconProps,
  ToolCardLinkProps,
  ToolCardRootProps,
} from "./tool-card";
export { BoardCard, BoardCards, BoardColumn, BoardColumnHeader, BoardEmpty } from "./board";
export type { BoardColumnHeaderProps, BoardRootProps } from "./board";
