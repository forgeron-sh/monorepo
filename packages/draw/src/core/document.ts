// A board as JSON: the canvas document (`version`, `items`, `viewport?`) with a `format` field and
// every item's data checked against its kind. Reading fills what a field may leave out (a fill, a
// dash) and refuses what it cannot read, rather than guessing. Version 1.

import { CanvasFormatError, deserialize, type Viewport } from "@forgeron/canvas";
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_TEXT_SIZE } from "./create";
import { STICKY_COLORS } from "./palette";
import {
  DRAW_KINDS,
  type ArrowEnd,
  type DrawData,
  type DrawFill,
  type DrawItem,
  type DrawKind,
  type DrawStroke,
} from "./types";

export const DRAW_FORMAT = "forgeron/draw";
export const DRAW_VERSION = 1;

export interface BoardDocument {
  format: typeof DRAW_FORMAT;
  version: typeof DRAW_VERSION;
  items: DrawItem[];
  viewport?: Viewport;
}

export class DrawFormatError extends CanvasFormatError {
  override name = "DrawFormatError";
}

/** The board as JSON, items bottom first. */
export function serializeBoard(items: ReadonlyArray<DrawItem>, viewport?: Viewport): string {
  const doc: BoardDocument = { format: DRAW_FORMAT, version: DRAW_VERSION, items: [...items] };
  if (viewport) doc.viewport = viewport;
  return JSON.stringify(doc);
}

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const TYPE_OF: Record<DrawKind, DrawData["type"]> = {
  rectangle: "shape",
  ellipse: "shape",
  diamond: "shape",
  sticky: "sticky",
  text: "text",
  arrow: "arrow",
  pen: "pen",
  frame: "frame",
  image: "image",
};

function readFill(v: unknown): DrawFill {
  if (!isObject(v)) return DEFAULT_FILL;
  const opacity = typeof v.opacity === "number" ? { opacity: v.opacity } : {};
  if (v.type === "solid" && typeof v.color === "string")
    return { type: "solid", color: v.color, ...opacity };
  if (v.type === "pattern" && typeof v.color === "string" && typeof v.pattern === "string")
    return { type: "pattern", pattern: v.pattern, color: v.color, ...opacity };
  return DEFAULT_FILL;
}

function readStroke(v: unknown): DrawStroke {
  if (!isObject(v)) return DEFAULT_STROKE;
  const dash = v.dash === "dashed" || v.dash === "dotted" ? v.dash : "solid";
  return {
    color: typeof v.color === "string" ? v.color : null,
    width: num(v.width, DEFAULT_STROKE.width),
    dash,
  };
}

function readEnd(v: unknown, at: string): ArrowEnd {
  if (!isObject(v)) throw new DrawFormatError(`${at} must be a point.`);
  const end: ArrowEnd = { x: num(v.x, 0), y: num(v.y, 0) };
  if (typeof v.bind === "string" && v.bind) end.bind = v.bind;
  return end;
}

function readData(kind: DrawKind, raw: unknown, at: string): DrawData {
  if (!isObject(raw)) throw new DrawFormatError(`${at}.data is missing.`);
  if (raw.type !== TYPE_OF[kind])
    throw new DrawFormatError(`${at}.data.type must be "${TYPE_OF[kind]}" for a ${kind}.`);
  const common = {
    ...(typeof raw.group === "string" && raw.group ? { group: raw.group } : {}),
    ...(typeof raw.frame === "string" && raw.frame ? { frame: raw.frame } : {}),
  };
  switch (raw.type) {
    case "shape":
      return {
        type: "shape",
        fill: readFill(raw.fill),
        stroke: readStroke(raw.stroke),
        ...(typeof raw.text === "string" && raw.text ? { text: raw.text } : {}),
        ...common,
      };
    case "sticky":
      return {
        type: "sticky",
        color:
          typeof raw.color === "string" && raw.color in STICKY_COLORS
            ? (raw.color as never)
            : "amber",
        text: str(raw.text, ""),
        ...common,
      };
    case "text":
      return {
        type: "text",
        text: str(raw.text, ""),
        size: num(raw.size, DEFAULT_TEXT_SIZE),
        color: str(raw.color, "ink"),
        align: raw.align === "center" || raw.align === "right" ? raw.align : "left",
        ...common,
      };
    case "arrow":
      return {
        type: "arrow",
        start: readEnd(raw.start, `${at}.data.start`),
        end: readEnd(raw.end, `${at}.data.end`),
        head: raw.head === "none" || raw.head === "both" ? raw.head : "end",
        route: raw.route === "elbow" ? "elbow" : "straight",
        stroke: readStroke(raw.stroke),
        ...common,
      };
    case "pen": {
      const points = raw.points;
      if (!Array.isArray(points) || points.length % 2 || !points.every(Number.isInteger))
        throw new DrawFormatError(`${at}.data.points must be pairs of whole pixels.`);
      return {
        type: "pen",
        points: points as number[],
        cols: Math.max(1, num(raw.cols, 1)),
        rows: Math.max(1, num(raw.rows, 1)),
        color: str(raw.color, "ink"),
        weight: Math.min(4, Math.max(1, Math.round(num(raw.weight, 1)))),
        ...common,
      };
    }
    case "frame":
      return {
        type: "frame",
        name: str(raw.name, "Frame"),
        ...(typeof raw.group === "string" && raw.group ? { group: raw.group } : {}),
      };
    case "image":
      if (typeof raw.src !== "string") throw new DrawFormatError(`${at}.data.src is missing.`);
      return { type: "image", src: raw.src, name: str(raw.name, "Image"), ...common };
  }
  throw new DrawFormatError(`${at}.data.type is unknown.`);
}

/** Reads a board written by `serializeBoard` (or any canvas document of draw items). */
export function parseBoard(json: string): { items: DrawItem[]; viewport?: Viewport } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new DrawFormatError("Not JSON.");
  }
  if (isObject(raw) && raw.format !== undefined && raw.format !== DRAW_FORMAT)
    throw new DrawFormatError(`Not a board: format ${String(raw.format)}.`);
  const doc = deserialize<unknown>(json);
  const items = doc.items.map((item, i) => {
    const at = `items[${i}]`;
    if (!(DRAW_KINDS as ReadonlyArray<string>).includes(item.kind))
      throw new DrawFormatError(`${at}.kind ${item.kind} is not a kind of draw.`);
    const kind = item.kind as DrawKind;
    return { ...item, data: readData(kind, item.data, at) } as DrawItem;
  });
  return { items, ...(doc.viewport ? { viewport: doc.viewport } : {}) };
}
