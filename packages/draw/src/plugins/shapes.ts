// The shapes, core half: a rectangle, an ellipse and a diamond with a fill (none, solid, dither
// pattern), a stroke and a label. Three plugins that share one `shape` data type; each owns its
// kind, so a board can take the rectangle alone.

import type { Bounds, FarPrimitive, NewItem } from "@forgeron/canvas";
import { diamondPoints, insideDiamond, insideEllipse } from "../core/geometry";
import { colorCss } from "../core/palette";
import { definePlugin, type KindSpec } from "../core/plugin";
import { readCommon, readFill, readStroke, str, type Raw } from "../core/parse";
import { DEFAULT_FILL, DEFAULT_STROKE, type DrawStyle } from "../core/style";
import { fillOf, n, strokeAttrs, textLines, wash, type SvgNode } from "../core/svg";
import type { DrawData, DrawItem, ShapeData, ShapeKind } from "../core/types";

/** A shape item with the board's defaults: what a tool adds, what a test builds. */
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

const parseShape = (raw: Raw): DrawData => ({
  type: "shape",
  fill: readFill(raw.fill),
  stroke: readStroke(raw.stroke),
  ...(typeof raw.text === "string" && raw.text ? { text: raw.text } : {}),
  ...readCommon(raw),
});

function paintShape(item: DrawItem, o: Parameters<KindSpec["paint"]>[1]): SvgNode[] {
  const b = item.bounds;
  const d = item.data as ShapeData;
  const { paint, defs } = fillOf(d.fill, item.id, o);
  const half = d.stroke.color ? d.stroke.width / 2 : 0;
  const inner = {
    x: b.x + half,
    y: b.y + half,
    w: Math.max(0, b.w - half * 2),
    h: Math.max(0, b.h - half * 2),
  };
  const opacity: SvgNode["attrs"] =
    d.fill.type !== "none" && (d.fill.opacity ?? 1) < 1 ? { fillOpacity: d.fill.opacity ?? 1 } : {};
  const common: SvgNode["attrs"] = { fill: paint, ...opacity, ...strokeAttrs(d.stroke, o) };
  const shape =
    item.kind === "ellipse"
      ? n("ellipse", {
          cx: b.x + b.w / 2,
          cy: b.y + b.h / 2,
          rx: inner.w / 2,
          ry: inner.h / 2,
          ...common,
        })
      : item.kind === "diamond"
        ? n("polygon", {
            points: diamondPoints(inner)
              .map((p) => `${p.x},${p.y}`)
              .join(" "),
            ...common,
          })
        : n("rect", {
            x: inner.x,
            y: inner.y,
            width: inner.w,
            height: inner.h,
            shapeRendering: "crispEdges",
            ...common,
          });
  const out: SvgNode[] = [...(defs.length ? [n("defs", {}, defs)] : []), shape];
  if (o.text && d.text) {
    const pad = 8;
    out.push(
      textLines(
        d.text,
        { x: b.x + pad, y: b.y + pad, w: b.w - pad * 2, h: b.h - pad * 2 },
        14,
        o.color("ink"),
        "center",
        true,
      ),
    );
  }
  return out;
}

function farShape(item: DrawItem, frame?: Bounds): FarPrimitive[] {
  const b = item.bounds;
  const clip = frame ? { clip: frame } : {};
  const d = item.data as ShapeData;
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

const shape = (label: string, canvas: KindSpec["canvas"]): KindSpec => ({
  type: "shape",
  label,
  canvas: { resize: { minW: 8, minH: 8 }, ...canvas },
  parse: parseShape,
  paint: paintShape,
  far: farShape,
  words: (item) => str((item.data as ShapeData).text, ""),
});

export const rectangle = definePlugin({
  id: "rectangle",
  name: "Rectangle",
  description: "A rectangle with a fill, a stroke and a label.",
  kinds: { rectangle: shape("Rectangle", {}) },
});

export const ellipse = definePlugin({
  id: "ellipse",
  name: "Ellipse",
  description: "An ellipse with a fill, a stroke and a label; clicks reach its curve, not its box.",
  kinds: {
    ellipse: shape("Ellipse", { hitTest: (i, p) => insideEllipse(i.bounds, p) }),
  },
});

export const diamond = definePlugin({
  id: "diamond",
  name: "Diamond",
  description: "A diamond with a fill, a stroke and a label; clicks reach its lozenge.",
  kinds: {
    diamond: shape("Diamond", { hitTest: (i, p) => insideDiamond(i.bounds, p) }),
  },
});

/** The three shapes. */
export const shapePlugins = [rectangle, ellipse, diamond] as const;
