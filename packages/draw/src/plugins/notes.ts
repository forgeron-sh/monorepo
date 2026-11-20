// The notes, core half: sticky notes that grow with their text, and free text.

import type { NewItem, Point } from "@forgeron/canvas";
import { STICKY_COLORS, colorCss } from "../core/palette";
import { definePlugin, type KindSpec } from "../core/plugin";
import { num, readCommon, str, type Raw } from "../core/parse";
import { DEFAULT_TEXT_SIZE } from "../core/style";
import { n, textLines, wash, type SvgNode } from "../core/svg";
import {
  FAR_ZOOM,
  STICKY_PADDING,
  STICKY_TEXT,
  stickyHeight,
  textHeight,
  textWidth,
} from "../core/text";
import type {
  DrawColor,
  DrawData,
  StickyColor,
  StickyData,
  TextAlign,
  TextData,
} from "../core/types";

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

const stickyKind: KindSpec = {
  type: "sticky",
  label: "Sticky note",
  canvas: { resize: { minW: 80, minH: 80 } },
  parse: (raw: Raw) => ({
    type: "sticky",
    color:
      typeof raw.color === "string" && raw.color in STICKY_COLORS ? (raw.color as never) : "amber",
    text: str(raw.text, ""),
    ...readCommon(raw),
  }),
  paint(item, o) {
    const b = item.bounds;
    const d = item.data as StickyData;
    const c = STICKY_COLORS[d.color] ?? STICKY_COLORS.amber;
    const out: SvgNode[] = [
      n("rect", {
        x: b.x + 0.5,
        y: b.y + 0.5,
        width: b.w - 1,
        height: b.h - 1,
        fill: o.color(c.paper),
        stroke: o.color(c.edge),
        strokeWidth: 1,
        shapeRendering: "crispEdges",
      }),
      n("rect", {
        x: b.x,
        y: b.y,
        width: b.w,
        height: 4,
        fill: o.color(c.edge),
        shapeRendering: "crispEdges",
      }),
    ];
    if (o.text && d.text) {
      const p = STICKY_PADDING;
      out.push(
        textLines(
          d.text,
          { x: b.x + p, y: b.y + p, w: b.w - p * 2, h: b.h - p * 2 },
          STICKY_TEXT,
          o.color("ink"),
          "left",
          false,
        ),
      );
    }
    return out;
  },
  far(item, frame) {
    const b = item.bounds;
    const d = item.data as StickyData;
    const clip = frame ? { clip: frame } : {};
    const c = STICKY_COLORS[d.color] ?? STICKY_COLORS.amber;
    return [
      { type: "rect", ...b, fill: colorCss(c.paper), ...clip },
      {
        type: "rect",
        x: b.x,
        y: b.y,
        w: b.w,
        h: Math.min(4, b.h),
        fill: colorCss(c.edge),
        ...clip,
      },
    ];
  },
  gpu(item, frame) {
    const b = item.bounds;
    const c = STICKY_COLORS[(item.data as StickyData).color] ?? STICKY_COLORS.amber;
    const clip = frame ? { clip: frame } : {};
    return [
      {
        type: "rect",
        ...b,
        fill: colorCss(c.paper),
        stroke: colorCss(c.edge),
        strokeWidth: 1,
        crisp: true,
        ...clip,
      },
      { type: "rect", x: b.x, y: b.y, w: b.w, h: 4, fill: colorCss(c.edge), crisp: true, ...clip },
    ];
  },
  opaque: () => true,
  words: (item) => (item.data as StickyData).text,
};

const textKind: KindSpec = {
  type: "text",
  label: "Text",
  // A text grows downwards with its lines: only its width is set by hand.
  canvas: { resize: { handles: ["e", "w"], minW: 24 } },
  parse: (raw: Raw) => ({
    type: "text",
    text: str(raw.text, ""),
    size: num(raw.size, DEFAULT_TEXT_SIZE),
    color: str(raw.color, "ink"),
    align: raw.align === "center" || raw.align === "right" ? raw.align : "left",
    ...readCommon(raw),
  }),
  paint(item, o) {
    const d = item.data as TextData;
    return o.text && d.text
      ? [textLines(d.text, item.bounds, d.size, o.color(d.color), d.align, false)]
      : [];
  },
  far(item, frame) {
    const d = item.data as TextData;
    const clip = frame ? { clip: frame } : {};
    return d.text
      ? [{ type: "rect", ...item.bounds, fill: wash(colorCss(d.color), 0.25), ...clip }]
      : [];
  },
  // From `FAR_ZOOM` up the DOM shows the words; under it, a wash of the box.
  gpu(item, frame) {
    const d = item.data as TextData;
    const clip = frame ? { clip: frame } : {};
    return d.text
      ? [
          {
            type: "rect",
            ...item.bounds,
            fill: wash(colorCss(d.color), 0.25),
            maxZoom: FAR_ZOOM,
            ...clip,
          },
        ]
      : [];
  },
  words: (item) => (item.data as TextData).text,
};

export const sticky = definePlugin({
  id: "sticky",
  name: "Sticky note",
  description: "A note in a token colour that grows with its text.",
  kinds: { sticky: stickyKind },
});

export const text = definePlugin({
  id: "text",
  name: "Text",
  description: "Free text on the board, a size, a colour and an alignment, typed in place.",
  kinds: { text: textKind },
});
