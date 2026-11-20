// Frames, core half: a named area that groups the items whose centre is inside it. An item belongs
// to the top-most frame that holds its centre; it moves with the frame, is clipped by it, and is
// exported with it. Frames do not nest. Membership is stored on the item (`data.frame`) and kept up
// to date by the rules this plugin adds to the draw engine: a frame that moves takes its items
// (`carry`), membership is settled when a change ends (`settle`), a copy of a frame's items points
// at the copy of the frame (`copy`).

import type { Bounds, ItemChange, NewItem, Point } from "@forgeron/canvas";
import { containsCenter, distanceToSegment } from "../core/geometry";
import { colorCss } from "../core/palette";
import { definePlugin, type Changes, type KindSpec } from "../core/plugin";
import { readCommon, str, type Raw } from "../core/parse";
import { FONT_MONO, n, type SvgNode } from "../core/svg";
import { fitLine } from "../core/text";
import { isFrame, type DrawData, type DrawItem, type FrameData } from "../core/types";

/** World units of a frame's edge that grab it, and the height of its name strip. */
export const FRAME_EDGE = 8;
export const FRAME_TITLE = 24;

/** A frame is grabbed by its name strip and its edge; inside, clicks reach the board. */
export function frameHit(item: DrawItem, p: Point): boolean {
  const b = item.bounds;
  if (p.y - b.y <= FRAME_TITLE) return true;
  const corners = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ];
  for (let i = 0; i < 4; i++) {
    if (distanceToSegment(p, corners[i]!, corners[(i + 1) % 4]!) <= FRAME_EDGE) return true;
  }
  return false;
}

export function frameItem(bounds: Bounds, name: string): NewItem<DrawData> {
  return { kind: "frame", bounds, data: { type: "frame", name } };
}

/** The frame an item belongs to by its position: the top-most one holding its centre. */
export function frameFor(
  item: DrawItem,
  frames: ReadonlyArray<DrawItem<FrameData>>,
): DrawItem<FrameData> | null {
  if (isFrame(item)) return null;
  let best: DrawItem<FrameData> | null = null;
  for (const f of frames) {
    if (f.id === item.id) continue;
    if (containsCenter(f.bounds, item.bounds) && (!best || f.z > best.z)) best = f;
  }
  return best;
}

/** The items of a frame, in stacking order. */
export const frameChildren = (items: ReadonlyArray<DrawItem>, frameId: string) =>
  items.filter((i) => i.data.type !== "frame" && i.data.frame === frameId);

/**
 * The changes that put `ids` (every item when left out) in the frame that holds them now, and
 * raise an item that joins a frame above it.
 */
export function membershipChanges(
  items: ReadonlyArray<DrawItem>,
  ids?: ReadonlySet<string>,
): Array<readonly [string, ItemChange<DrawData>]> {
  const frames = items.filter(isFrame);
  const out: Array<readonly [string, ItemChange<DrawData>]> = [];
  let top = items.at(-1)?.z ?? 0;
  for (const item of items) {
    if (isFrame(item) || (ids && !ids.has(item.id))) continue;
    const frame = frameFor(item, frames);
    const now = item.data.type === "frame" ? undefined : item.data.frame;
    if ((frame?.id ?? undefined) === now) continue;
    const { frame: _old, ...rest } = item.data as Exclude<DrawData, FrameData>;
    const data = (frame ? { ...rest, frame: frame.id } : rest) as DrawData;
    const change: ItemChange<DrawData> = { data };
    if (frame && item.z < frame.z) change.z = ++top;
    out.push([item.id, change]);
  }
  return out;
}

const translated = (was: DrawItem, now: DrawItem) =>
  was.data === now.data &&
  was.bounds.w === now.bounds.w &&
  was.bounds.h === now.bounds.h &&
  (was.bounds.x !== now.bounds.x || was.bounds.y !== now.bounds.y);

/** A frame that moved takes along its items that did not move themselves. */
export function frameFollow(
  before: ReadonlyMap<string, DrawItem>,
  after: ReadonlyArray<DrawItem>,
  changed: ReadonlySet<string>,
): Changes {
  const moves = new Map<string, { dx: number; dy: number }>();
  for (const item of after) {
    if (!changed.has(item.id) || !isFrame(item)) continue;
    const was = before.get(item.id);
    if (was && translated(was, item)) {
      moves.set(item.id, { dx: item.bounds.x - was.bounds.x, dy: item.bounds.y - was.bounds.y });
    }
  }
  if (moves.size === 0) return [];
  const out: Changes = [];
  for (const item of after) {
    const frame = item.data.type === "frame" ? undefined : item.data.frame;
    const d = frame ? moves.get(frame) : undefined;
    if (!d || changed.has(item.id) || item.locked) continue;
    const b = item.bounds;
    out.push([item.id, { bounds: { ...b, x: b.x + d.dx, y: b.y + d.dy } }]);
  }
  return out;
}

/** The items whose frame may have changed: all of them when a frame itself changed. */
function settleSet(
  before: ReadonlyMap<string, DrawItem>,
  items: ReadonlyArray<DrawItem>,
  ids: ReadonlySet<string>,
): ReadonlySet<string> | undefined {
  for (const item of items) if (isFrame(item) && ids.has(item.id)) return undefined;
  for (const id of ids) if (before.get(id)?.data.type === "frame") return undefined;
  return ids;
}

const frameKind: KindSpec = {
  type: "frame",
  label: "Frame",
  canvas: { resize: { minW: 80, minH: 60 }, hitTest: frameHit },
  parse: (raw: Raw) => {
    // A frame carries a group but no frame of its own: frames do not nest.
    const { group } = readCommon(raw);
    return { type: "frame", name: str(raw.name, "Frame"), ...(group ? { group } : {}) };
  },
  paint(item, o) {
    const b = item.bounds;
    const d = item.data as FrameData;
    const out: SvgNode[] = [
      n("rect", {
        x: b.x + 0.5,
        y: b.y + 0.5,
        width: b.w - 1,
        height: b.h - 1,
        fill: "none",
        stroke: o.color("line"),
        strokeWidth: 1,
        shapeRendering: "crispEdges",
      }),
      n("rect", {
        x: b.x,
        y: b.y,
        width: b.w,
        height: FRAME_TITLE,
        fill: o.color("raised"),
        shapeRendering: "crispEdges",
      }),
    ];
    if (o.text) {
      out.push(
        n(
          "text",
          {
            x: b.x + 8,
            y: b.y + 16,
            fill: o.color("muted"),
            fontFamily: FONT_MONO,
            fontSize: 11,
          },
          [{ tag: "tspan", attrs: {}, text: d.name }],
        ),
      );
    }
    return out;
  },
  far(item) {
    const b = item.bounds;
    return [
      { type: "rect", ...b, stroke: colorCss("line"), strokeWidth: 1 },
      { type: "rect", x: b.x, y: b.y, w: b.w, h: FRAME_TITLE, fill: colorCss("raised") },
      {
        type: "text",
        x: b.x + 8,
        y: b.y + 12,
        text: (item.data as FrameData).name,
        size: 11,
        font: "mono",
        color: colorCss("muted"),
        maxWidth: Math.max(0, b.w - 16),
        minSize: 1,
      },
    ];
  },
  // Its edge and name strip, and its name as the DOM set it: 11 px mono on a 16 px line, 8 units
  // in, cut with an ellipsis; a bar of its width when it is under a screen pixel high.
  gpu(item, _frame, options) {
    const b = item.bounds;
    const name = (item.data as FrameData).name;
    const w = Math.max(0, b.w - 16);
    return [
      { type: "rect", ...b, stroke: colorCss("line"), strokeWidth: 1, crisp: true },
      {
        type: "rect",
        x: b.x,
        y: b.y,
        w: b.w,
        h: FRAME_TITLE,
        fill: colorCss("raised"),
        crisp: true,
      },
      ...(name && options?.words !== false
        ? [
            {
              type: "glyphs" as const,
              font: { family: "mono" as const, size: 11 },
              color: colorCss("muted"),
              lineHeight: 16,
              lines: [{ x: b.x + 8, y: b.y + 4, text: fitLine(name, 11, w, "mono") }],
              clip: { x: b.x + 8, y: b.y + 4, w, h: 16 },
              minSize: 1,
              greek: true,
            },
          ]
        : []),
    ];
  },
  words: (item) => (item.data as FrameData).name,
  exportName: (item) => (item.data as FrameData).name,
};

const clipId = (id: string) => `fgd-clip-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

export const frame = definePlugin({
  id: "frame",
  name: "Frame",
  description:
    "A named area that carries its items, clips them and exports them: an item belongs to the frame holding its centre.",
  kinds: { frame: frameKind },
  engineRules: {
    carry: ({ before, items, changed }) => frameFollow(before, items, changed),
    settle: ({ before, items, ids }) => membershipChanges(items, settleSet(before, items, ids)),
    copy({ sources, copies }) {
      const ids = new Map<string, string>();
      sources.forEach((s, i) => {
        const c = copies[i];
        if (c) ids.set(s.id, c.id);
      });
      const out: Changes = [];
      for (const copy of copies) {
        const data = copy.data;
        if (data.type !== "frame" && data.frame && ids.has(data.frame)) {
          out.push([copy.id, { data: { ...data, frame: ids.get(data.frame)! } }]);
        }
      }
      return out;
    },
  },
  svg: {
    scope(items, wanted) {
      const wantedFrames = new Set(
        items.filter((i) => wanted.has(i.id) && i.data.type === "frame").map((i) => i.id),
      );
      if (wantedFrames.size === 0) return [];
      return items
        .filter((i) => i.data.type !== "frame" && !!i.data.frame && wantedFrames.has(i.data.frame))
        .map((i) => i.id);
    },
    standalone: (item) => item.data.type === "frame",
    layer(items) {
      const byId = new Map(items.filter((i) => i.data.type === "frame").map((f) => [f.id, f]));
      if (byId.size === 0) return {};
      return {
        defs: [...byId.values()].map((f) => ({
          tag: "clipPath",
          attrs: { id: clipId(f.id) },
          children: [
            {
              tag: "rect",
              attrs: { x: f.bounds.x, y: f.bounds.y, width: f.bounds.w, height: f.bounds.h },
            },
          ],
        })),
        wrap(item, nodes) {
          const ref = item.data.type === "frame" ? undefined : item.data.frame;
          if (!ref || !byId.has(ref)) return undefined;
          return [{ tag: "g", attrs: { clipPath: `url(#${clipId(ref)})` }, children: nodes }];
        },
      };
    },
  },
});
