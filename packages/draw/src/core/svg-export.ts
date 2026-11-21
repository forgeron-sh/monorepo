// The SVG export with the registry given: what `export.ts` does for the default plugins, and what
// the `svg` and `png` plugins run. Export: a frame or a selection as a standalone SVG document,
// from the same paint as the editor.
// Colours are resolved to hex codes (from the page's tokens when given, else the dark theme), text
// is written as SVG text. What a kind adds (the items of a frame come with it, clipped by it) is
// in the plugin's `svg` rules; an item no plugin knows is left out. The PNG is drawn from this SVG
// by the React layer, which has a canvas to draw it on.

import { unionBounds, type Bounds } from "@forgeron/canvas";
import type { ExportContext, Registry } from "./plugin";
import { exportPaint, toMarkup, type SvgNode } from "./svg";
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

/** The items an export of `ids` holds, bottom first: the plugins add theirs (a frame's items). */
export function exportedItemsOf(
  registry: Registry,
  items: ReadonlyArray<DrawItem>,
  ids: Iterable<string>,
): DrawItem[] {
  const wanted = new Set(ids);
  for (const rules of registry.svg) {
    if (rules.scope) for (const id of rules.scope(items, wanted)) wanted.add(id);
  }
  return items.filter((i) => wanted.has(i.id) && registry.kind(i.kind));
}

/** A frame or a selection as an SVG document; null when there is nothing to export. */
export function exportSvgWith(
  registry: Registry,
  all: ReadonlyArray<DrawItem>,
  { ids, padding, background = null, resolve }: ExportOptions,
): ExportResult | null {
  const wanted = [...ids];
  const items = exportedItemsOf(registry, all, wanted);
  if (items.length === 0) return null;
  const only = wanted.length === 1 ? items.find((i) => i.id === wanted[0]) : undefined;
  const lone = only && registry.svg.some((r) => r.standalone?.(only)) ? only : undefined;
  const pad = padding ?? (lone ? 0 : 16);
  const box = lone ? lone.bounds : unionBounds(items.map((i) => i.bounds))!;
  const bounds = {
    x: Math.floor(box.x - pad),
    y: Math.floor(box.y - pad),
    w: Math.ceil(box.w + pad * 2),
    h: Math.ceil(box.h + pad * 2),
  };
  const o = exportPaint(resolve);
  const layers = registry.svg.flatMap((r) => (r.layer ? [r.layer(items)] : []));
  const defs: SvgNode[] = layers.flatMap((l) => l.defs ?? []);
  const body: SvgNode[] = [];
  if (background) {
    const { x, y, w: width, h: height } = bounds;
    body.push({ tag: "rect", attrs: { x, y, width, height, fill: o.color(background) } });
  }
  for (const item of items) {
    let nodes = registry.kind(item.kind)?.paint(item, o) ?? [];
    for (const layer of layers) {
      const wrapped = layer.wrap?.(item, nodes);
      if (wrapped) {
        nodes = wrapped;
        break;
      }
    }
    body.push(...nodes);
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.w}" height="${bounds.h}" ` +
    `viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}">` +
    (defs.length ? `<defs>${toMarkup(defs)}</defs>` : "") +
    toMarkup(body) +
    `</svg>`;
  return { svg, bounds, items };
}

/** The base name of an export: a frame's name when it is exported alone, else `selection`. */
export function exportName(ctx: ExportContext): string {
  const lone = ctx.ids.length === 1 ? ctx.items.find((i) => i.id === ctx.ids[0]) : undefined;
  return (lone && ctx.registry.kind(lone.kind)?.exportName?.(lone)) ?? "selection";
}

/** The SVG of an export context, or null when there is nothing to export. */
export function exportSvgOf(ctx: ExportContext): ExportResult | null {
  return exportSvgWith(ctx.registry, ctx.items, {
    ids: ctx.ids,
    ...(ctx.background !== undefined ? { background: ctx.background } : {}),
    ...(ctx.resolve ? { resolve: ctx.resolve } : {}),
  });
}
