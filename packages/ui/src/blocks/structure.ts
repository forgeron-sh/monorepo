// Blocks of the "structure" group: the outline, the org chart, templates and covers. None of it
// knows an app: they take plain nodes, headings, people and texts. Each block lives in its own file
// next to this one; this barrel re-exports them. `Tree` and `DiffView` are primitives (src/tree.tsx,
// src/diff.tsx) and `InlineComments` is a conversation block: their names stay exported from here.

export { Tree } from "../tree";
export type { TreeMove, TreeNode, TreeProps, TreeRowState } from "../tree";
export { Outline } from "./structure-outline";
export type { OutlineHeading, OutlineProps, OutlineTarget } from "./structure-outline";
export { OrgCardBody, OrgChart } from "./structure-org-chart";
export type { OrgCardState, OrgChartProps, OrgPerson } from "./structure-org-chart";
export { TemplateGallery } from "./structure-template-gallery";
export type { TemplateGalleryProps, TemplateItem } from "./structure-template-gallery";
export { CoverArt, CoverPicker } from "./structure-cover-picker";
export type {
  CoverArtProps,
  CoverPickerProps,
  CoverTone,
  CoverValue,
} from "./structure-cover-picker";
export { InlineComments, inlineCommentAnchorTop } from "./conversation-comments";
export type {
  InlineComment,
  InlineCommentsProps,
  InlineThread,
  InlineThreadFilter,
} from "./conversation-comments";
export { DiffView, FieldDiff, VersionCompare } from "../diff";
export type {
  CompareVersion,
  DiffMode,
  DiffViewProps,
  FieldDiffProps,
  VersionCompareProps,
} from "../diff";
export {
  STRUCTURE_COVER_COLS,
  STRUCTURE_COVER_PATTERNS,
  STRUCTURE_COVER_ROWS,
  structureActiveHeading,
  structureClampPercent,
  structureCoverCells,
  structureCoverPath,
  structureDescendants,
  structureDiffFields,
  structureDiffRows,
  structureDiffSeq,
  structureDiffStats,
  structureDiffWords,
  structureDropPlacement,
  structureDropZone,
  structureFilter,
  structureFilterTemplates,
  structureFind,
  structureFlatten,
  structureFormatValue,
  structureHeadingsFrom,
  structureHighlight,
  structureIds,
  structureLayoutThreads,
  structureMove,
  structureOrgLayout,
  structureOrgNavigate,
  structureOutlineTree,
  structurePath,
  structureRandom,
  structureRebaseAnchor,
  structureSafeImageUrl,
  structureShift,
  structureSlug,
  structureSplitRows,
  structureTemplateCategories,
  structureToggle,
  structureTokens,
} from "./structure-model";
export type {
  StructureAnchor,
  StructureCoverPattern,
  StructureDiffOp,
  StructureDiffOptions,
  StructureDiffPiece,
  StructureDiffRow,
  StructureDropZone,
  StructureEdit,
  StructureFieldChange,
  StructureFieldStatus,
  StructureFilterResult,
  StructureHeading,
  StructureOrgBox,
  StructureOrgLayout,
  StructureOrgLink,
  StructureOrgSize,
  StructurePlacement,
  StructureRow,
  StructureSegment,
  StructureShift,
  StructureSplitRow,
  StructureThreadBox,
  StructureTreeLike,
} from "./structure-model";
