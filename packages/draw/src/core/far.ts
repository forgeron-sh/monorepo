// What each kind looks like from far (a zoom under `FAR_ZOOM`), as canvas far primitives: shapes,
// notes and texts as plain boxes with no pattern and no words, strokes as their line, arrows as
// lines with their heads, frames as their edge and name strip. The same look as the DOM's far
// view (`react/render.tsx`), drawn on the GPU by the canvas's far layer.

import type { Bounds, FarPrimitive } from "@forgeron/canvas";
import { arrowHead, arrowRoute } from "./arrows";
import { FRAME_TITLE } from "./kinds";
import { colorCss, STICKY_COLORS } from "./palette";
import type { ArrowData, DrawItem } from "./types";

/** Under this zoom the editor draws the far view of each item. */
export const FAR_ZOOM = 0.35;

/** A pattern drawn far out: its colour, as light as its dither. */
export const wash = (color: string, share: number) =>
  `color-mix(in srgb, ${color} ${Math.round(share * 100)}%, transparent)`;

/** The far primitives of an item; `frame` is the bounds of the frame that clips it. */
export function farPrimitives(item: DrawItem, frame?: Bounds): FarPrimitive[] {
  const b = item.bounds;
  const d = item.data;
  const clip = frame ? { clip: frame } : {};
  switch (d.type) {
    case "shape": {
      const fill =
        d.fill.type === "none"
          ? undefined
          : d.fill.type === "solid"
            ? colorCss(d.fill.color)
            : wash(colorCss(d.fill.color), 0.4);
      const edge = d.stroke.color ? colorCss(d.stroke.color) : undefined;
      if (item.kind === "diamond") {
        // The DOM clips a box to the diamond: its border is cut away, the fill (or a wash of the
        // edge) is what shows.
        const tone = fill ?? (edge ? wash(edge, 0.35) : undefined);
        return tone ? [{ type: "diamond", ...b, fill: tone, ...clip }] : [];
      }
      return [
        {
          type: item.kind === "ellipse" ? "ellipse" : "rect",
          ...b,
          ...(fill ? { fill } : {}),
          ...(edge ? { stroke: edge, strokeWidth: Math.max(1, d.stroke.width) } : {}),
          ...clip,
        },
      ];
    }
    case "sticky": {
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
    }
    case "text":
      return d.text ? [{ type: "rect", ...b, fill: wash(colorCss(d.color), 0.25), ...clip }] : [];
    case "arrow": {
      const route = arrowRoute(item as DrawItem<ArrowData>);
      const color = colorCss(d.stroke.color ?? "ink");
      const w = Math.max(1, d.stroke.width);
      const out: FarPrimitive[] = [
        { type: "line", points: route.flatMap((p) => [p.x, p.y]), color, width: w, ...clip },
      ];
      const size = 6 + w * 2;
      const head = (from: (typeof route)[number], tip: (typeof route)[number]) => {
        const [a, b2, c] = arrowHead(from, tip, size);
        out.push({
          type: "triangle",
          points: [a.x, a.y, b2.x, b2.y, c.x, c.y],
          fill: color,
          ...clip,
        });
      };
      if (d.head !== "none" && route.length > 1) head(route.at(-2)!, route.at(-1)!);
      if (d.head === "both" && route.length > 1) head(route[1]!, route[0]!);
      return out;
    }
    case "pen": {
      // Far out, a stroke is its line: its pixels would be smaller than a screen pixel. The DOM's
      // non-scaling stroke still takes the world's CSS scale, so the line is one world unit wide.
      const sx = b.w / Math.max(1, d.cols);
      const sy = b.h / Math.max(1, d.rows);
      const points: number[] = [];
      for (let i = 0; i + 1 < d.points.length; i += 2) {
        points.push(b.x + (d.points[i]! + 0.5) * sx, b.y + (d.points[i + 1]! + 0.5) * sy);
      }
      return [{ type: "line", points, color: colorCss(d.color), width: 1, ...clip }];
    }
    case "frame":
      return [
        { type: "rect", ...b, stroke: colorCss("line"), strokeWidth: 1 },
        { type: "rect", x: b.x, y: b.y, w: b.w, h: FRAME_TITLE, fill: colorCss("raised") },
        {
          type: "text",
          x: b.x + 8,
          y: b.y + 12,
          text: d.name,
          size: 11,
          font: "mono",
          color: colorCss("muted"),
          maxWidth: Math.max(0, b.w - 16),
          minSize: 1,
        },
      ];
    case "image":
      return [];
  }
}
