// How each kind is drawn, as a small tree of SVG nodes in world units: the editor renders it with
// React, the export writes it as markup. One description, so what is exported is what is seen.
// Text that the editor edits in the DOM (sticky notes, texts, shape labels) is only painted when
// `text` is on (the export).

import type { Bounds, Point } from "@forgeron/canvas";
import { arrowHead, arrowRoute } from "./arrows";
import { diamondPoints } from "./geometry";
import { colorCss, colorHex, patternCells, PATTERN_PIXEL, STICKY_COLORS } from "./palette";
import { strokePath } from "./pen";
import { LINE_HEIGHT, STICKY_PADDING, STICKY_TEXT, wrapLines } from "./text";
import { FRAME_TITLE } from "./kinds";
import type { DrawColor, DrawDash, DrawFill, DrawItem, DrawStroke } from "./types";

export interface SvgNode {
  tag: string;
  /** Attribute names as React writes them (`strokeWidth`); `toMarkup` turns them into SVG's. */
  attrs: Record<string, string | number>;
  children?: SvgNode[];
  text?: string;
}

export interface PaintOptions {
  /** A colour as SVG paint: `var(--token)` in the page, a hex code in an export. */
  color: (color: DrawColor | null | undefined) => string;
  /** Makes ids unique on the page: a prefix per editor. */
  idPrefix: string;
  /** Paints the text of stickies, texts and labels (the DOM does it in the editor). */
  text: boolean;
}

export const pagePaint = (idPrefix: string): PaintOptions => ({
  color: colorCss,
  idPrefix,
  text: false,
});
export const exportPaint = (resolve?: (token: string) => string | undefined): PaintOptions => ({
  color: (c) => colorHex(c, resolve),
  idPrefix: "fgd",
  text: true,
});

const FONT_SANS = "Geist, ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'Geist Mono', ui-monospace, monospace";

const n = (tag: string, attrs: SvgNode["attrs"], children?: SvgNode[]): SvgNode =>
  children ? { tag, attrs, children } : { tag, attrs };

export function dashArray(dash: DrawDash, width: number): string | undefined {
  const w = Math.max(1, width);
  if (dash === "dashed") return `${w * 4} ${w * 3}`;
  if (dash === "dotted") return `${w} ${w * 2}`;
  return undefined;
}

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_");

function strokeAttrs(s: DrawStroke, o: PaintOptions): SvgNode["attrs"] {
  if (!s.color || s.width <= 0) return { stroke: "none" };
  const dash = dashArray(s.dash, s.width);
  return {
    stroke: o.color(s.color),
    strokeWidth: s.width,
    strokeLinejoin: "miter",
    ...(dash ? { strokeDasharray: dash } : {}),
  };
}

/** The fill of a shape: a colour, a dither pattern (with its `<pattern>` to define), or none. */
function fillOf(fill: DrawFill, id: string, o: PaintOptions): { paint: string; defs: SvgNode[] } {
  if (fill.type === "none") return { paint: "none", defs: [] };
  if (fill.type === "solid") return { paint: o.color(fill.color), defs: [] };
  const pid = `${o.idPrefix}-p-${safeId(id)}`;
  const px = PATTERN_PIXEL;
  const cells = patternCells(fill.pattern);
  const d = cells.map(([x, y]) => `M${x * px} ${y * px}h${px}v${px}h-${px}z`).join("");
  return {
    paint: `url(#${pid})`,
    defs: [
      n("pattern", { id: pid, width: px * 4, height: px * 4, patternUnits: "userSpaceOnUse" }, [
        n("path", { d, fill: o.color(fill.color) }),
      ]),
    ],
  };
}

function textLines(
  text: string,
  box: Bounds,
  size: number,
  color: string,
  align: "left" | "center" | "right",
  middle: boolean,
  family = FONT_SANS,
): SvgNode {
  const lines = wrapLines(text, box.w, size);
  const lh = size * LINE_HEIGHT;
  const top = middle ? box.y + (box.h - lines.length * lh) / 2 : box.y;
  const x = align === "left" ? box.x : align === "right" ? box.x + box.w : box.x + box.w / 2;
  const anchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
  return n(
    "text",
    { fill: color, fontFamily: family, fontSize: size, textAnchor: anchor },
    lines.map((line, i) => ({
      tag: "tspan",
      attrs: { x, y: Math.round((top + lh * i + size * 1.05) * 100) / 100 },
      text: line,
    })),
  );
}

/** The nodes that draw an item, in world units. */
export function paintItem(item: DrawItem, o: PaintOptions): SvgNode[] {
  const b = item.bounds;
  const d = item.data;
  switch (d.type) {
    case "shape": {
      const { paint, defs } = fillOf(d.fill, item.id, o);
      const half = d.stroke.color ? d.stroke.width / 2 : 0;
      const inner = {
        x: b.x + half,
        y: b.y + half,
        w: Math.max(0, b.w - half * 2),
        h: Math.max(0, b.h - half * 2),
      };
      const opacity: SvgNode["attrs"] =
        d.fill.type !== "none" && (d.fill.opacity ?? 1) < 1
          ? { fillOpacity: d.fill.opacity ?? 1 }
          : {};
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
    case "sticky": {
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
    }
    case "text":
      return o.text && d.text
        ? [textLines(d.text, b, d.size, o.color(d.color), d.align, false)]
        : [];
    case "arrow": {
      const route = arrowRoute(item as DrawItem<typeof d>);
      const color = o.color(d.stroke.color ?? "ink");
      const w = Math.max(1, d.stroke.width);
      const dash = dashArray(d.stroke.dash, w);
      const out: SvgNode[] = [
        n("polyline", {
          points: route.map((p) => `${p.x},${p.y}`).join(" "),
          fill: "none",
          stroke: color,
          strokeWidth: w,
          strokeLinejoin: "miter",
          ...(dash ? { strokeDasharray: dash } : {}),
        }),
      ];
      const size = 6 + w * 2;
      const head = (from: Point, tip: Point) =>
        n("polygon", {
          points: arrowHead(from, tip, size)
            .map((p) => `${p.x},${p.y}`)
            .join(" "),
          fill: color,
        });
      if (d.head !== "none" && route.length > 1) out.push(head(route.at(-2)!, route.at(-1)!));
      if (d.head === "both" && route.length > 1) out.push(head(route[1]!, route[0]!));
      return out;
    }
    case "pen": {
      const sx = b.w / Math.max(1, d.cols);
      const sy = b.h / Math.max(1, d.rows);
      return [
        n("path", {
          d: strokePath(d),
          fill: o.color(d.color),
          shapeRendering: "crispEdges",
          transform: `translate(${b.x} ${b.y}) scale(${sx} ${sy})`,
        }),
      ];
    }
    case "frame": {
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
    }
    case "image":
      return [
        n("image", {
          href: d.src,
          x: b.x,
          y: b.y,
          width: b.w,
          height: b.h,
          preserveAspectRatio: "none",
        }),
      ];
  }
}

const KEBAB: Record<string, string> = {
  strokeWidth: "stroke-width",
  strokeLinejoin: "stroke-linejoin",
  strokeDasharray: "stroke-dasharray",
  shapeRendering: "shape-rendering",
  fillOpacity: "fill-opacity",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  textAnchor: "text-anchor",
  clipPath: "clip-path",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The nodes as SVG markup. */
export function toMarkup(nodes: ReadonlyArray<SvgNode>): string {
  return nodes
    .map((node) => {
      const attrs = Object.entries(node.attrs)
        .map(([k, v]) => ` ${KEBAB[k] ?? k}="${escape(String(v))}"`)
        .join("");
      const inner =
        (node.text !== undefined ? escape(node.text) : "") + toMarkup(node.children ?? []);
      return inner ? `<${node.tag}${attrs}>${inner}</${node.tag}>` : `<${node.tag}${attrs}/>`;
    })
    .join("");
}
