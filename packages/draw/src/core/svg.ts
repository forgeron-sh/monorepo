// The vocabulary every kind paints with: a small tree of SVG nodes in world units, the paint
// options (page or export), strokes, dither fills, wrapped text and the markup writer. The kinds
// (`../plugins`) describe themselves with it; `paint.ts` looks the kind up. One description, so
// what is exported is what is seen. Text that the editor edits in the DOM (sticky notes, texts,
// shape labels) is only painted when `text` is on (the export).

import type { Bounds } from "@forgeron/canvas";
import { colorCss, colorHex, patternCells, PATTERN_PIXEL } from "./palette";
import { LINE_HEIGHT, wrapLines } from "./text";
import type { DrawColor, DrawDash, DrawFill, DrawStroke } from "./types";

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
export const FONT_MONO = "'Geist Mono', ui-monospace, monospace";

export const n = (tag: string, attrs: SvgNode["attrs"], children?: SvgNode[]): SvgNode =>
  children ? { tag, attrs, children } : { tag, attrs };

export function dashArray(dash: DrawDash, width: number): string | undefined {
  const w = Math.max(1, width);
  if (dash === "dashed") return `${w * 4} ${w * 3}`;
  if (dash === "dotted") return `${w} ${w * 2}`;
  return undefined;
}

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_");

export function strokeAttrs(s: DrawStroke, o: PaintOptions): SvgNode["attrs"] {
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
export function fillOf(
  fill: DrawFill,
  id: string,
  o: PaintOptions,
): { paint: string; defs: SvgNode[] } {
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

export function textLines(
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

/** A pattern drawn far out: its colour, as light as its dither. */
export const wash = (color: string, share: number) =>
  `color-mix(in srgb, ${color} ${Math.round(share * 100)}%, transparent)`;
