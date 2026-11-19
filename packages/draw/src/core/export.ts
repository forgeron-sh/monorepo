// Export: a frame or a selection as a standalone SVG document, from the same paint as the editor.
// Colours are resolved to hex codes (from the page's tokens when given, else the dark theme), text
// is written as SVG text, the items of a frame are clipped by it. The PNG is drawn from this SVG
// by the React layer, which has a canvas to draw it on.

import { unionBounds, type Bounds } from "@forgeron/canvas";
import { exportPaint, paintItem, toMarkup, type SvgNode } from "./paint";
import type { DrawColor, DrawItem } from "./types";

export interface ExportOptions {
  /** The items to export, by id; a frame brings its items. */
  ids: Iterable<string>;
  /** World units around the selection; none around a frame alone. */
  padding?: number;
  /** A background colour, or none (transparent). */
  background?: DrawColor | null;
  /** Reads a token's value from the page, e.g. `getComputedStyle(el).getPropertyValue`. */
  resolve?: (token: string) => string | undefined;
}

export interface ExportResult {
  svg: string;
  /** The exported area in world units: its size is the SVG's size. */
  bounds: Bounds;
  items: DrawItem[];
}

/** The items an export of `ids` holds, bottom first: the frames bring their items. */
export function exportedItems(items: ReadonlyArray<DrawItem>, ids: Iterable<string>): DrawItem[] {
  const wanted = new Set(ids);
  const frames = new Set(
    items.filter((i) => wanted.has(i.id) && i.data.type === "frame").map((i) => i.id),
  );
  return items.filter(
    (i) =>
      wanted.has(i.id) || (i.data.type !== "frame" && !!i.data.frame && frames.has(i.data.frame)),
  );
}

/** A frame or a selection as an SVG document; null when there is nothing to export. */
export function exportSvg(
  all: ReadonlyArray<DrawItem>,
  { ids, padding, background = null, resolve }: ExportOptions,
): ExportResult | null {
  const wanted = [...ids];
  const items = exportedItems(all, wanted);
  if (items.length === 0) return null;
  const only = wanted.length === 1 ? items.find((i) => i.id === wanted[0]) : undefined;
  const lone = only?.data.type === "frame" ? only : undefined;
  const pad = padding ?? (lone ? 0 : 16);
  const box = lone ? lone.bounds : unionBounds(items.map((i) => i.bounds))!;
  const bounds = {
    x: Math.floor(box.x - pad),
    y: Math.floor(box.y - pad),
    w: Math.ceil(box.w + pad * 2),
    h: Math.ceil(box.h + pad * 2),
  };
  const o = exportPaint(resolve);
  const frames = new Map(
    items.filter((i) => i.data.type === "frame").map((f) => [f.id, f] as const),
  );
  const defs: SvgNode[] = [...frames.values()].map((f) => ({
    tag: "clipPath",
    attrs: { id: `fgd-clip-${f.id.replace(/[^a-zA-Z0-9_-]/g, "_")}` },
    children: [
      {
        tag: "rect",
        attrs: { x: f.bounds.x, y: f.bounds.y, width: f.bounds.w, height: f.bounds.h },
      },
    ],
  }));
  const body: SvgNode[] = [];
  if (background) {
    const { x, y, w: width, h: height } = bounds;
    body.push({ tag: "rect", attrs: { x, y, width, height, fill: o.color(background) } });
  }
  for (const item of items) {
    const nodes = paintItem(item, o);
    const frame = item.data.type === "frame" ? undefined : item.data.frame;
    if (frame && frames.has(frame)) {
      body.push({
        tag: "g",
        attrs: { clipPath: `url(#fgd-clip-${frame.replace(/[^a-zA-Z0-9_-]/g, "_")})` },
        children: nodes,
      });
    } else body.push(...nodes);
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.w}" height="${bounds.h}" ` +
    `viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}">` +
    (defs.length ? `<defs>${toMarkup(defs)}</defs>` : "") +
    toMarkup(body) +
    `</svg>`;
  return { svg, bounds, items };
}
