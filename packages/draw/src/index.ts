// @forgeron/draw: the whiteboard on @forgeron/canvas, a minimal core and plugins (D-154). Plain
// data and pure functions, no React and no DOM: the plugin contract (core half), the draw engine
// that runs the plugins' rules in the same undo step as a change, the board's JSON, the SVG export
// and the helpers of each kind. Every function takes the list of plugins it works with and defaults
// to the `full` preset's core halves. The bundled plugins are in `@forgeron/draw/plugins`, the
// editor and the editor halves in `@forgeron/draw/react` and `@forgeron/draw/plugins/editor`.

export { createRegistry, definePlugin, PluginError, resolvePlugins } from "./core/plugin";
export type {
  Changes,
  ChangeContext,
  CopyContext,
  DrawPlugin,
  EngineRules,
  ExportContext,
  ExportOutput,
  ExportSpec,
  KindSpec,
  Plugins,
  RawItem,
  Registry,
  RemoveContext,
  SettleContext,
  SvgRules,
} from "./core/plugin";
export { DEFAULT_REGISTRY, registryOf } from "./core/defaults";
export { align, distribute, type AlignEdge } from "./plugins/align";
export { expandGroups, group, newGroupId, ungroup } from "./plugins/groups";
export { toggleLock } from "./plugins/lock";
export {
  ARROW_GAP,
  ARROW_PAD,
  arrowEnds,
  arrowFollow,
  arrowHead,
  arrowHit,
  arrowRoute,
  canBind,
  layoutArrow,
  layoutArrowFrom,
  routeBetween,
} from "./plugins/arrow";
export type { ArrowGeometry, Lookup } from "./plugins/arrow";
export {
  arrowItem,
  DEFAULT_FILL,
  DEFAULT_STROKE,
  DEFAULT_STYLE,
  DEFAULT_TEXT_SIZE,
  frameItem,
  imageBounds,
  imageItem,
  shapeItem,
  STICKY_SIZE,
  stickyItem,
  textItem,
} from "./core/create";
export type { DrawStyle } from "./core/create";
export {
  DRAW_FORMAT,
  DRAW_VERSION,
  DrawFormatError,
  parseBoard,
  serializeBoard,
} from "./core/document";
export type { BoardDocument, ParseOptions } from "./core/document";
export { boundsOfItems, createDrawEngine, createDrawStore, remapCopies } from "./core/engine";
export type { DrawEngine, DrawEngineOptions, DrawStore } from "./core/engine";
export { exportedItems, exportName, exportSvg, exportSvgOf } from "./core/export";
export { FAR_ZOOM, farPrimitives } from "./core/far";
export type { ExportOptions, ExportResult } from "./core/export";
export { changedIds } from "./core/follow";
export { frameChildren, frameFollow, frameFor, membershipChanges } from "./plugins/frame";
export {
  distanceToPolyline,
  distanceToSegment,
  insideDiamond,
  insideEllipse,
  outlinePoint,
} from "./core/geometry";
export { drawKinds, FRAME_EDGE, FRAME_TITLE, frameHit } from "./core/kinds";
export { dashArray, exportPaint, pagePaint, paintItem, toMarkup } from "./core/paint";
// What a plugin of your own paints and reads with.
export { fillOf, n as svgNode, strokeAttrs, textLines, wash } from "./core/svg";
export { isObject, num, readCommon, readFill, readStroke, str } from "./core/parse";
export type { PaintOptions, SvgNode } from "./core/paint";
export {
  colorCss,
  colorHex,
  DRAW_PALETTE,
  DRAW_PATTERNS,
  fromPicker,
  isHex,
  patternCells,
  pickerValue,
  STICKY_COLORS,
  STICKY_ORDER,
} from "./core/palette";
export type { PaletteColor } from "./core/palette";
export {
  linePixels,
  PEN_PIXEL,
  penFromPoints,
  penHit,
  simplify,
  strokePath,
  strokePixels,
  toPixels,
} from "./plugins/pen";
export type { PenOptions } from "./plugins/pen";
export {
  STICKY_PADDING,
  STICKY_TEXT,
  stickyHeight,
  textHeight,
  textWidth,
  wrapLines,
} from "./core/text";
export { DRAW_KINDS, isArrow, isFrame, isPen, isShape } from "./core/types";
export type {
  ArrowData,
  ArrowEnd,
  ArrowHead,
  ArrowRoute,
  DrawColor,
  DrawCommon,
  DrawDash,
  DrawData,
  DrawFill,
  DrawItem,
  DrawKind,
  DrawStroke,
  FrameData,
  ImageData,
  PenData,
  ShapeData,
  ShapeKind,
  StickyColor,
  StickyData,
  TextAlign,
  TextData,
} from "./core/types";
