// Constructors of new items with the board's defaults: what a tool adds, what a test builds.

import type { Bounds, NewItem, Point } from "@forgeron/canvas";
import { layoutArrowFrom, type Lookup } from "./arrows";
import { stickyHeight, textHeight, textWidth } from "./text";
import type {
  ArrowData,
  ArrowHead,
  ArrowRoute,
  DrawColor,
  DrawData,
  DrawFill,
  DrawStroke,
  ShapeKind,
  StickyColor,
  TextAlign,
} from "./types";

export const DEFAULT_STROKE: DrawStroke = { color: "ink", width: 2, dash: "solid" };
export const DEFAULT_FILL: DrawFill = { type: "none" };
export const DEFAULT_TEXT_SIZE = 20;

/** What a new item takes when its tool draws it: the inspector's last choices. */
export interface DrawStyle {
  fill: DrawFill;
  stroke: DrawStroke;
  sticky: StickyColor;
  textSize: number;
  textColor: DrawColor;
  head: ArrowHead;
  route: ArrowRoute;
  penColor: DrawColor;
  penWeight: number;
}

export const DEFAULT_STYLE: DrawStyle = {
  fill: DEFAULT_FILL,
  stroke: DEFAULT_STROKE,
  sticky: "amber",
  textSize: DEFAULT_TEXT_SIZE,
  textColor: "ink",
  head: "end",
  route: "straight",
  penColor: "accent",
  penWeight: 1,
};

export function shapeItem(
  kind: ShapeKind,
  bounds: Bounds,
  style: Partial<Pick<DrawStyle, "fill" | "stroke">> = {},
  text?: string,
): NewItem<DrawData> {
  return {
    kind,
    bounds,
    data: {
      type: "shape",
      fill: style.fill ?? DEFAULT_FILL,
      stroke: style.stroke ?? DEFAULT_STROKE,
      ...(text ? { text } : {}),
    },
  };
}

export const STICKY_SIZE = 160;

export function stickyItem(
  at: Point,
  text = "",
  color: StickyColor = "amber",
  width = STICKY_SIZE,
): NewItem<DrawData> {
  return {
    kind: "sticky",
    bounds: { x: at.x, y: at.y, w: width, h: stickyHeight(text, width) },
    data: { type: "sticky", color, text },
  };
}

export function textItem(
  at: Point,
  text = "",
  size = DEFAULT_TEXT_SIZE,
  color: DrawColor = "ink",
  align: TextAlign = "left",
): NewItem<DrawData> {
  const w = Math.max(size * 4, textWidth(text, size) + 4);
  return {
    kind: "text",
    bounds: { x: at.x, y: at.y, w, h: textHeight(text, w, size) },
    data: { type: "text", text, size, color, align },
  };
}

export function arrowItem(
  start: Point,
  end: Point,
  get: Lookup,
  options: {
    startBind?: string;
    endBind?: string;
    head?: ArrowHead;
    route?: ArrowRoute;
    stroke?: DrawStroke;
  } = {},
): NewItem<DrawData> {
  const data: ArrowData = {
    type: "arrow",
    start: { x: 0, y: 0, ...(options.startBind ? { bind: options.startBind } : {}) },
    end: { x: 0, y: 0, ...(options.endBind ? { bind: options.endBind } : {}) },
    head: options.head ?? "end",
    route: options.route ?? "straight",
    stroke: options.stroke ?? DEFAULT_STROKE,
  };
  const g = layoutArrowFrom(data, start, end, get);
  return { kind: "arrow", bounds: g.bounds, data: g.data };
}

export function frameItem(bounds: Bounds, name: string): NewItem<DrawData> {
  return { kind: "frame", bounds, data: { type: "frame", name } };
}

export function imageItem(bounds: Bounds, src: string, name: string): NewItem<DrawData> {
  return { kind: "image", bounds, data: { type: "image", src, name } };
}

/** The bounds an image takes at a point: its natural size, no wider than `max`. */
export function imageBounds(at: Point, width: number, height: number, max = 480): Bounds {
  const scale = width > max ? max / width : 1;
  return {
    x: at.x,
    y: at.y,
    w: Math.max(16, Math.round(width * scale)),
    h: Math.max(16, Math.round(height * scale)),
  };
}
