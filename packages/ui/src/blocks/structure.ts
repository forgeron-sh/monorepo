// Blocks of the "structure" group: everything around a document except the editor itself: the tree
// of pages, the outline, the org chart, templates, covers, comments in the margin, and the diff of
// two versions. None of it knows an app: they take plain nodes, headings, people and texts. Each
// block lives in its own file next to this one; this barrel re-exports them.

export { Tree } from "./structure-tree";
export type { TreeMove, TreeNode, TreeProps, TreeRowState } from "./structure-tree";
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
export { InlineComments, inlineCommentAnchorTop } from "./structure-comments";
export type {
  InlineComment,
  InlineCommentsProps,
  InlineThread,
  InlineThreadFilter,
} from "./structure-comments";
export { DiffView, FieldDiff, VersionCompare } from "./structure-diff";
export type {
  CompareVersion,
  DiffMode,
  DiffViewProps,
  FieldDiffProps,
  VersionCompareProps,
} from "./structure-diff";
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
