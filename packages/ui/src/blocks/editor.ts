// Blocks of the "editor chrome and guidance" group: the pure-UI pieces around any canvas-like or
// document editor (tool dock, zoom, minimap, layers, comment pins, presence, style panels,
// shortcuts sheet) and the onboarding around it (tour, checklist). Nothing here imports an
// editor: they are driven by props and callbacks so any editor can adopt them. Each block lives in
// its own file next to this one; this barrel re-exports them.

export {
  EDITOR_CAPS,
  EDITOR_DASHES,
  EDITOR_FILL_PATTERNS,
  EDITOR_PATTERN_NAMES,
  EDITOR_PRESENCE_TONES,
  EDITOR_ZOOM_MAX,
  EDITOR_ZOOM_MIN,
  EDITOR_ZOOM_STEPS,
  editorBoundsOf,
  editorCenterViewport,
  editorChecklistProgress,
  editorClampViewport,
  editorClampZoom,
  editorDashArray,
  editorDescendantIds,
  editorDropLayer,
  editorDropPlace,
  editorDropTarget,
  editorEntryKeys,
  editorFillZoom,
  editorFindLayer,
  editorFitZoom,
  editorFlattenLayers,
  editorFromMap,
  editorGroupShortcuts,
  editorIndentLayer,
  editorInkOn,
  editorIsGroup,
  editorMinimapFit,
  editorMoveLayer,
  editorNextStep,
  editorOpacityText,
  editorOutdentLayer,
  editorPanViewport,
  editorParseZoom,
  editorPatternCells,
  editorPatternDensity,
  editorPresenceTone,
  editorProject,
  editorReorderLayer,
  editorScaleViewport,
  editorSelectLayers,
  editorShortcutEntries,
  editorStepZoom,
  editorToMap,
  editorTourIndex,
  editorTourPlacement,
  editorUnion,
  editorUnproject,
  editorUpdateLayer,
  editorZoomAround,
  editorZoomText,
} from "./editor-model";
export type {
  EditorCap,
  EditorChecklistProgress,
  EditorDash,
  EditorLayer,
  EditorLayerRow,
  EditorLayerTarget,
  EditorMapFit,
  EditorPlacement,
  EditorPoint,
  EditorPresenceTone,
  EditorRect,
  EditorReorder,
  EditorShortcutEntry,
  EditorShortcutSection,
  EditorSide,
  EditorSize,
  EditorView,
} from "./editor-model";
export { CanvasToolbar } from "./editor-canvas-toolbar";
export type { CanvasToolbarProps, EditorTool, EditorToolVariant } from "./editor-canvas-toolbar";
export { ZoomControls } from "./editor-zoom-controls";
export type { ZoomControlsProps, ZoomShortcuts } from "./editor-zoom-controls";
export { Minimap } from "./editor-minimap";
export type { MinimapItem, MinimapProps } from "./editor-minimap";
export { LayersPanel } from "./editor-layers-panel";
export type { LayersPanelProps } from "./editor-layers-panel";
export { CommentPin, PinLayer } from "./editor-comment-pins";
export type { CommentPinProps, EditorPinData, PinLayerProps } from "./editor-comment-pins";
export { CursorPresence } from "./editor-cursor-presence";
export type { CursorPresenceProps, EditorCursor } from "./editor-cursor-presence";
export { FillPicker, PatternSwatch, StrokePicker } from "./editor-style-pickers";
export type {
  EditorFill,
  EditorStroke,
  FillPickerProps,
  StrokeField,
  StrokePickerProps,
} from "./editor-style-pickers";
export { ShortcutsSheet } from "./editor-shortcuts-sheet";
export type { ShortcutsSheetProps } from "./editor-shortcuts-sheet";
export { Tour } from "./editor-tour";
export type { TourLabels, TourProps, TourStep, TourTarget } from "./editor-tour";
export { OnboardingChecklist } from "./editor-onboarding";
export type { OnboardingChecklistProps, OnboardingStep } from "./editor-onboarding";
