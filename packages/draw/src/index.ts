// @forgeron/draw: the whiteboard on @forgeron/canvas. Plain data and pure functions, no React and
// no DOM: the item kinds (shapes, sticky notes, text, arrows, the pixel pen, frames, images), the
// draw engine that keeps arrows on their items and frames around theirs, arranging, the board's
// JSON and the SVG export. The editor is `@forgeron/draw/react`.

export {
  align,
  distribute,
  expandGroups,
  group,
  newGroupId,
  toggleLock,
  ungroup,
} from "./core/arrange";
export type { AlignEdge } from "./core/arrange";
export {
  ARROW_GAP,
  ARROW_PAD,
  arrowEnds,
  arrowHead,
  arrowHit,
  arrowRoute,
  canBind,
  layoutArrow,
  layoutArrowFrom,
  routeBetween,
} from "./core/arrows";
export type { ArrowGeometry, Lookup } from "./core/arrows";
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
export type { BoardDocument } from "./core/document";
export { boundsOfItems, createDrawEngine, createDrawStore, remapCopies } from "./core/engine";
export type { DrawEngineOptions, DrawStore } from "./core/engine";
export { exportedItems, exportSvg } from "./core/export";
export { farPrimitives } from "./core/far";
export type { ExportOptions, ExportResult } from "./core/export";
export { arrowFollow, changedIds, frameFollow } from "./core/follow";
export { frameChildren, frameFor, membershipChanges } from "./core/frames";
export {
  distanceToPolyline,
  distanceToSegment,
  insideDiamond,
  insideEllipse,
  outlinePoint,
} from "./core/geometry";
export { drawKinds, FRAME_EDGE, FRAME_TITLE, frameHit } from "./core/kinds";
export { dashArray, exportPaint, pagePaint, paintItem, toMarkup } from "./core/paint";
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
} from "./core/pen";
export type { PenOptions } from "./core/pen";
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
