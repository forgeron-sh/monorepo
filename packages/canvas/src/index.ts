// @forgeron/canvas: the headless engine of the editors that work on an infinite surface. Plain data
// and pure functions, no React and no DOM: the model, the camera, the grid, hit testing, selection,
// history, serialisation and the store. The React layer is `@forgeron/canvas/react`.

export {
  center,
  containsBounds,
  containsPoint,
  inflate,
  intersects,
  normalizeBounds,
  pointInPolygon,
  rectFromPoints,
  unionBounds,
} from "./core/geometry";
export {
  createFarPack,
  FAR_FLAG,
  FAR_KIND,
  FAR_STRIDE,
  packFar,
  parseCssColor,
  resetFarPack,
} from "./core/far";
export type {
  FarColor,
  FarDash,
  FarGlyphs,
  FarGlyphSource,
  FarImage,
  FarLine,
  FarPack,
  FarPolygon,
  FarPrimitive,
  FarRgba,
  FarRuns,
  FarShape,
  FarText,
  FarTriangle,
  PackOptions,
} from "./core/far";
export { createFarBuffer, farMoved } from "./core/far-buffer";
export type { FarBuffer, FarBufferUpdate, FarGroup } from "./core/far-buffer";
export { clusters, ellipsize, lineWidth, placeLine, wrapText } from "./core/text";
export type { FarFont, FarTextMetrics, PlacedLine } from "./core/text";
export { DEFAULT_GRID, gridOffset, gridStep, snap, snapBounds, snapPoint } from "./core/grid";
export type { GridOptions } from "./core/grid";
export {
  applyPatches,
  createHistory,
  invertPatch,
  invertPatches,
  mergePatches,
  record,
  redo,
  seal,
  touchedIds,
  undo,
} from "./core/history";
export type { History, HistoryEntry, Patch, Step } from "./core/history";
export {
  handleAt,
  handlePosition,
  hitTest,
  itemsInLasso,
  itemsInRect,
  nearestInDirection,
  readingOrder,
  resizeBounds,
  topDown,
} from "./core/hit";
export type { BoxMode, Direction, ResizeOptions } from "./core/hit";
export { CANVAS_KEYMAP, canRun, DEFAULT_NUDGE, runCommand } from "./core/keymap";
export type { CanvasCommand, KeyBinding, NudgeSteps } from "./core/keymap";
export { isMovable, isSelectable, kindOf, resizeRule } from "./core/kinds";
export type { KindDefinition, KindMap, ResizeRule } from "./core/kinds";
export { applySelection, EMPTY_SELECTION, pruneSelection, sameSelection } from "./core/selection";
export type { Selection, SelectMode } from "./core/selection";
export { CanvasFormatError, deserialize, FORMAT_VERSION, serialize } from "./core/serialize";
export type { CanvasDocument } from "./core/serialize";
export type {
  CanvasEngine,
  CanvasState,
  CommitMeta,
  EngineCommand,
  EngineQuery,
  EngineResult,
  EngineSettings,
  NewItem,
  QueryResults,
} from "./core/engine";
export { createTsEngine } from "./core/ts-engine";
export type { TsEngineOptions } from "./core/ts-engine";
export { createCanvasStore, withCommands } from "./core/store";
export type { CanvasStore, CanvasStoreOptions, FitViewOptions } from "./core/store";
export {
  DRAG_THRESHOLD,
  gestureFor,
  isDrag,
  LASSO_TOOL,
  PAN_TOOL,
  SELECT_TOOL,
} from "./core/tools";
export type { CanvasTool, GestureKind, PressInput, PressTarget, ToolGesture } from "./core/tools";
export { HANDLES } from "./core/types";
export type {
  Bounds,
  CanvasPointer,
  Connection,
  ConnectionEnd,
  Handle,
  Item,
  ItemChange,
  Modifiers,
  Point,
  Size,
  Viewport,
} from "./core/types";
export {
  boundsToScreen,
  centerOn,
  clampZoom,
  cullWindow,
  DEFAULT_ZOOM,
  fitBounds,
  IDENTITY,
  intersectsView,
  lerpViewport,
  panBy,
  roundViewport,
  screenToWorld,
  stepZoom,
  visibleWorld,
  wheelZoomFactor,
  worldToScreen,
  zoomAt,
} from "./core/viewport";
export type { CullWindow, FitOptions, ZoomLimits } from "./core/viewport";
