// The model of the editor chrome blocks and their pure helpers: zoom steps, the minimap's maths,
// the layer tree, shortcuts grouped for a sheet, where a coachmark sits next to its target.
// Nothing here knows an editor: the blocks are driven by props and callbacks, so a canvas, a
// document or a flow editor can use them. Every helper is exported with an `editor` prefix.

import type { Action } from "../hooks/use-actions";
import { formatShortcut } from "../hooks/use-shortcuts";

/* ---------------------------------------------------------------- geometry */

export interface EditorRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EditorPoint {
  x: number;
  y: number;
}

export interface EditorSize {
  w: number;
  h: number;
}

/** What a canvas shows: the world point at its top-left and the zoom (1 = one pixel per unit). */
export interface EditorView {
  x: number;
  y: number;
  zoom: number;
}

const finite = (n: number, fallback: number) => (Number.isFinite(n) ? n : fallback);
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** A world point on screen, for pins and cursors laid over the canvas. */
export function editorProject(point: EditorPoint, view: EditorView): EditorPoint {
  return { x: (point.x - view.x) * view.zoom, y: (point.y - view.y) * view.zoom };
}

/** A screen point back in the world. */
export function editorUnproject(point: EditorPoint, view: EditorView): EditorPoint {
  return { x: point.x / view.zoom + view.x, y: point.y / view.zoom + view.y };
}

/* ---------------------------------------------------------------- zoom */

/** The steps `+` and `−` walk through, 1 = 100%. */
export const EDITOR_ZOOM_STEPS: ReadonlyArray<number> = [
  0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 8,
];
export const EDITOR_ZOOM_MIN = 0.02;
export const EDITOR_ZOOM_MAX = 64;

/** A zoom kept inside the limits; anything not a number reads as 1. */
export function editorClampZoom(
  zoom: number,
  min = EDITOR_ZOOM_MIN,
  max = EDITOR_ZOOM_MAX,
): number {
  return clamp(finite(zoom, 1), min, max);
}

/** The next step above (`1`) or below (`-1`) a zoom; a zoom between two steps goes to the nearer one in that way. */
export function editorStepZoom(
  zoom: number,
  direction: 1 | -1,
  steps: ReadonlyArray<number> = EDITOR_ZOOM_STEPS,
  min = EDITOR_ZOOM_MIN,
  max = EDITOR_ZOOM_MAX,
): number {
  const current = editorClampZoom(zoom, min, max);
  const eps = 1e-6;
  const sorted = [...steps].sort((a, b) => a - b);
  const next =
    direction === 1
      ? sorted.find((s) => s > current + eps)
      : [...sorted].reverse().find((s) => s < current - eps);
  return editorClampZoom(next ?? current, min, max);
}

/** The zoom that makes a content fit a viewport, with a margin around it; 1 for an empty content. */
export function editorFitZoom(
  content: EditorSize,
  viewport: EditorSize,
  padding = 0,
  min = EDITOR_ZOOM_MIN,
  max = EDITOR_ZOOM_MAX,
): number {
  if (content.w <= 0 || content.h <= 0) return 1;
  const w = Math.max(viewport.w - padding * 2, 1);
  const h = Math.max(viewport.h - padding * 2, 1);
  return editorClampZoom(Math.min(w / content.w, h / content.h), min, max);
}

/** The zoom that makes a content fill the viewport (the larger of the two ratios): it crops one side. */
export function editorFillZoom(
  content: EditorSize,
  viewport: EditorSize,
  min = EDITOR_ZOOM_MIN,
  max = EDITOR_ZOOM_MAX,
): number {
  if (content.w <= 0 || content.h <= 0) return 1;
  return editorClampZoom(Math.max(viewport.w / content.w, viewport.h / content.h), min, max);
}

/** `1.5` reads `150%`; below 10% a decimal is kept (`2.5%`). */
export function editorZoomText(zoom: number): string {
  const p = zoom * 100;
  const text = p < 10 ? String(Math.round(p * 10) / 10) : String(Math.round(p));
  return `${text}%`;
}

/** `"150"`, `"150%"` and `"1,5"` as the zoom they mean; null when it is not a number. */
export function editorParseZoom(text: string): number | null {
  const clean = text.trim().replace("%", "").replace(",", ".");
  if (clean === "" || !/^\d*\.?\d+$/.test(clean)) return null;
  const n = Number(clean);
  return n > 0 ? n / 100 : null;
}

/** The view after a zoom change that keeps the world point under `anchor` (a screen point) still. */
export function editorZoomAround(view: EditorView, zoom: number, anchor: EditorPoint): EditorView {
  const world = editorUnproject(anchor, view);
  return { x: world.x - anchor.x / zoom, y: world.y - anchor.y / zoom, zoom };
}

/* ---------------------------------------------------------------- minimap */

/** How the world fits in the map: a uniform scale and the offset that centres it. */
export interface EditorMapFit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** The scale and the offset that put `world` in a box of `size`, centred, nothing cut. */
export function editorMinimapFit(world: EditorRect, size: EditorSize): EditorMapFit {
  const scale = world.w > 0 && world.h > 0 ? Math.min(size.w / world.w, size.h / world.h) : 1;
  return {
    scale,
    offsetX: (size.w - world.w * scale) / 2,
    offsetY: (size.h - world.h * scale) / 2,
  };
}

/** A rectangle of the world, in map pixels. */
export function editorToMap(rect: EditorRect, world: EditorRect, fit: EditorMapFit): EditorRect {
  return {
    x: (rect.x - world.x) * fit.scale + fit.offsetX,
    y: (rect.y - world.y) * fit.scale + fit.offsetY,
    w: rect.w * fit.scale,
    h: rect.h * fit.scale,
  };
}

/** A map pixel, in the world. */
export function editorFromMap(
  point: EditorPoint,
  world: EditorRect,
  fit: EditorMapFit,
): EditorPoint {
  return {
    x: (point.x - fit.offsetX) / fit.scale + world.x,
    y: (point.y - fit.offsetY) / fit.scale + world.y,
  };
}

/** The viewport moved so that its centre stays inside the world. */
export function editorClampViewport(viewport: EditorRect, world: EditorRect): EditorRect {
  const cx = clamp(viewport.x + viewport.w / 2, world.x, world.x + world.w);
  const cy = clamp(viewport.y + viewport.h / 2, world.y, world.y + world.h);
  return { ...viewport, x: cx - viewport.w / 2, y: cy - viewport.h / 2 };
}

/** The viewport centred on a world point (a click on the map), kept inside the world. */
export function editorCenterViewport(
  viewport: EditorRect,
  point: EditorPoint,
  world: EditorRect,
): EditorRect {
  return editorClampViewport(
    { ...viewport, x: point.x - viewport.w / 2, y: point.y - viewport.h / 2 },
    world,
  );
}

/** The viewport moved by a world distance (a drag or an arrow), kept inside the world. */
export function editorPanViewport(
  viewport: EditorRect,
  dx: number,
  dy: number,
  world: EditorRect,
): EditorRect {
  return editorClampViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }, world);
}

/** The viewport scaled around its centre by `factor` (above 1 shows more of the world: zooming out), within the size limits. */
export function editorScaleViewport(
  viewport: EditorRect,
  factor: number,
  limits: { minW: number; maxW: number },
  world: EditorRect,
): EditorRect {
  if (viewport.w <= 0 || viewport.h <= 0 || !(factor > 0)) return viewport;
  const w = clamp(viewport.w * factor, limits.minW, limits.maxW);
  const f = w / viewport.w;
  const h = viewport.h * f;
  return editorClampViewport(
    { x: viewport.x + (viewport.w - w) / 2, y: viewport.y + (viewport.h - h) / 2, w, h },
    world,
  );
}

/** The rectangle that holds every item: the world of a minimap that is not given one. */
export function editorBoundsOf(rects: ReadonlyArray<EditorRect>, margin = 0): EditorRect {
  if (rects.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0 - margin, y: y0 - margin, w: x1 - x0 + margin * 2, h: y1 - y0 + margin * 2 };
}

/** The union of two rectangles: the world also holds what is on screen. */
export function editorUnion(a: EditorRect, b: EditorRect): EditorRect {
  const x0 = Math.min(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  return {
    x: x0,
    y: y0,
    w: Math.max(a.x + a.w, b.x + b.w) - x0,
    h: Math.max(a.y + a.h, b.y + b.h) - y0,
  };
}

/* ---------------------------------------------------------------- layers */

/** A layer: first in its list is on top. A layer with `children` is a group. */
export interface EditorLayer {
  id: string;
  name: string;
  /** Hidden when `false`. Default shown. */
  visible?: boolean;
  locked?: boolean;
  /** A group: its layers, first on top. Even an empty list makes a group. */
  children?: EditorLayer[];
  /** What the layer is: "Rectangle", "Text", shown after the name. */
  kind?: string;
}

/** Where a layer goes: inside `parentId` (null: the top level), at `index` among the siblings. */
export interface EditorLayerTarget {
  parentId: string | null;
  index: number;
}

export interface EditorLayerRow {
  layer: EditorLayer;
  depth: number;
  parentId: string | null;
  /** Position among its siblings. */
  index: number;
  siblings: number;
  /** Hidden by itself or by a group above it. */
  hiddenByParent: boolean;
  lockedByParent: boolean;
}

export const editorIsGroup = (layer: EditorLayer): boolean => layer.children !== undefined;

/** The visible rows of the tree, top to bottom, folding the groups in `collapsed`. */
export function editorFlattenLayers(
  layers: ReadonlyArray<EditorLayer>,
  collapsed: ReadonlySet<string> = new Set(),
): EditorLayerRow[] {
  const rows: EditorLayerRow[] = [];
  const walk = (
    list: ReadonlyArray<EditorLayer>,
    depth: number,
    parentId: string | null,
    hidden: boolean,
    locked: boolean,
  ) => {
    list.forEach((layer, index) => {
      rows.push({
        layer,
        depth,
        parentId,
        index,
        siblings: list.length,
        hiddenByParent: hidden,
        lockedByParent: locked,
      });
      if (layer.children && !collapsed.has(layer.id)) {
        walk(
          layer.children,
          depth + 1,
          layer.id,
          hidden || layer.visible === false,
          locked || layer.locked === true,
        );
      }
    });
  };
  walk(layers, 0, null, false, false);
  return rows;
}

/** A layer and where it sits, or null. */
export function editorFindLayer(
  layers: ReadonlyArray<EditorLayer>,
  id: string,
): { layer: EditorLayer; parentId: string | null; index: number } | null {
  const walk = (
    list: ReadonlyArray<EditorLayer>,
    parentId: string | null,
  ): { layer: EditorLayer; parentId: string | null; index: number } | null => {
    for (let index = 0; index < list.length; index += 1) {
      const layer = list[index]!;
      if (layer.id === id) return { layer, parentId, index };
      if (layer.children) {
        const found = walk(layer.children, layer.id);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(layers, null);
}

/** The ids of everything under a layer. */
export function editorDescendantIds(layer: EditorLayer): string[] {
  return (layer.children ?? []).flatMap((c) => [c.id, ...editorDescendantIds(c)]);
}

/** A tree with one layer changed (immutably). */
export function editorUpdateLayer(
  layers: ReadonlyArray<EditorLayer>,
  id: string,
  patch: Partial<Omit<EditorLayer, "id" | "children">>,
): EditorLayer[] {
  return layers.map((layer) => {
    if (layer.id === id) return { ...layer, ...patch };
    if (layer.children) return { ...layer, children: editorUpdateLayer(layer.children, id, patch) };
    return layer;
  });
}

const removeLayer = (
  layers: ReadonlyArray<EditorLayer>,
  id: string,
): { tree: EditorLayer[]; removed: EditorLayer | null } => {
  let removed: EditorLayer | null = null;
  const walk = (list: ReadonlyArray<EditorLayer>): EditorLayer[] => {
    const out: EditorLayer[] = [];
    for (const layer of list) {
      if (layer.id === id) {
        removed = layer;
        continue;
      }
      out.push(layer.children ? { ...layer, children: walk(layer.children) } : layer);
    }
    return out;
  };
  const tree = walk(layers);
  return { tree, removed };
};

const insertLayer = (
  layers: ReadonlyArray<EditorLayer>,
  layer: EditorLayer,
  target: EditorLayerTarget,
): EditorLayer[] => {
  if (target.parentId === null) {
    const next = [...layers];
    next.splice(clamp(target.index, 0, next.length), 0, layer);
    return next;
  }
  return layers.map((l) => {
    if (l.id === target.parentId) {
      const children = [...(l.children ?? [])];
      children.splice(clamp(target.index, 0, children.length), 0, layer);
      return { ...l, children };
    }
    return l.children ? { ...l, children: insertLayer(l.children, layer, target) } : l;
  });
};

/**
 * A tree with a layer moved to a new parent and index (the index counts siblings once the layer
 * is lifted out). A layer cannot go into itself or one of its own descendants: the tree comes back
 * unchanged, as it does for an unknown id or a target that is not a group.
 */
export function editorMoveLayer(
  layers: ReadonlyArray<EditorLayer>,
  id: string,
  target: EditorLayerTarget,
): EditorLayer[] {
  const found = editorFindLayer(layers, id);
  if (!found) return layers as EditorLayer[];
  if (target.parentId !== null) {
    if (target.parentId === id || editorDescendantIds(found.layer).includes(target.parentId))
      return layers as EditorLayer[];
    const parent = editorFindLayer(layers, target.parentId);
    if (!parent || !editorIsGroup(parent.layer)) return layers as EditorLayer[];
  }
  const { tree, removed } = removeLayer(layers, id);
  if (!removed) return layers as EditorLayer[];
  return insertLayer(tree, removed, target);
}

export type EditorReorder = "up" | "down" | "top" | "bottom";

/**
 * A layer moved one step towards the top (`up`) or bottom of its siblings, or to the end it names.
 * `up` means towards the front: the start of the list.
 */
export function editorReorderLayer(
  layers: ReadonlyArray<EditorLayer>,
  id: string,
  way: EditorReorder,
): EditorLayer[] {
  const found = editorFindLayer(layers, id);
  if (!found) return layers as EditorLayer[];
  const parent =
    found.parentId === null ? layers : editorFindLayer(layers, found.parentId)?.layer.children;
  const count = parent ? parent.length : 0;
  const index =
    way === "up"
      ? found.index - 1
      : way === "down"
        ? found.index + 1
        : way === "top"
          ? 0
          : count - 1;
  if (index < 0 || index >= count || index === found.index) return layers as EditorLayer[];
  return editorMoveLayer(layers, id, { parentId: found.parentId, index });
}

/** One level out: the layer goes after its group, in the group's parent. Unchanged at the top level. */
export function editorOutdentLayer(layers: ReadonlyArray<EditorLayer>, id: string): EditorLayer[] {
  const found = editorFindLayer(layers, id);
  if (!found || found.parentId === null) return layers as EditorLayer[];
  const parent = editorFindLayer(layers, found.parentId)!;
  return editorMoveLayer(layers, id, { parentId: parent.parentId, index: parent.index + 1 });
}

/** One level in: the layer goes at the end of the group just above it. Unchanged when that is not a group. */
export function editorIndentLayer(layers: ReadonlyArray<EditorLayer>, id: string): EditorLayer[] {
  const found = editorFindLayer(layers, id);
  if (!found || found.index === 0) return layers as EditorLayer[];
  const parent =
    found.parentId === null
      ? layers
      : (editorFindLayer(layers, found.parentId)?.layer.children ?? []);
  const above = parent[found.index - 1];
  if (!above || !editorIsGroup(above)) return layers as EditorLayer[];
  return editorMoveLayer(layers, id, { parentId: above.id, index: above.children!.length });
}

/** What a click does to the selection: replace, add or remove one (⌘ / Ctrl), or extend from the anchor (Shift). */
export function editorSelectLayers(
  rows: ReadonlyArray<EditorLayerRow>,
  selected: ReadonlyArray<string>,
  id: string,
  mode: "replace" | "toggle" | "range",
  anchor: string | null,
): string[] {
  if (mode === "replace") return [id];
  if (mode === "toggle")
    return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
  const from = rows.findIndex((r) => r.layer.id === (anchor ?? id));
  const to = rows.findIndex((r) => r.layer.id === id);
  if (from < 0 || to < 0) return [id];
  const [a, b] = from < to ? [from, to] : [to, from];
  return rows.slice(a, b + 1).map((r) => r.layer.id);
}

/** Where a drop lands for a pointer at `ratio` (0 top, 1 bottom) down a row: before, after, or inside a group. */
export function editorDropPlace(ratio: number, group: boolean): "before" | "inside" | "after" {
  if (group && ratio > 0.28 && ratio < 0.72) return "inside";
  return ratio < 0.5 ? "before" : "after";
}

/** The target a drop place on a row means. */
export function editorDropTarget(
  row: Pick<EditorLayerRow, "layer" | "parentId" | "index">,
  place: "before" | "inside" | "after",
): EditorLayerTarget {
  if (place === "inside") return { parentId: row.layer.id, index: 0 };
  return { parentId: row.parentId, index: row.index + (place === "after" ? 1 : 0) };
}

/** Like `editorMoveLayer` for a drop on a row: moving down within the same list counts the layer already lifted out. */
export function editorDropLayer(
  layers: ReadonlyArray<EditorLayer>,
  id: string,
  row: EditorLayerRow,
  place: "before" | "inside" | "after",
): EditorLayer[] {
  const found = editorFindLayer(layers, id);
  if (!found || found.layer.id === row.layer.id) return layers as EditorLayer[];
  const target = editorDropTarget(row, place);
  const adjust =
    place !== "inside" && found.parentId === target.parentId && found.index < target.index;
  return editorMoveLayer(layers, id, { ...target, index: target.index - (adjust ? 1 : 0) });
}

/* ---------------------------------------------------------------- shortcuts */

export interface EditorShortcutEntry {
  id: string;
  label: string;
  /** A combination as `useShortcuts` writes it: `"mod+shift+z"`. */
  shortcut?: string;
  /** Keys written out when a combination does not say it (`["Space", "drag"]`, `["⌥", "scroll"]`). */
  keys?: ReadonlyArray<string>;
  /** The section it is listed under. */
  group?: string;
  keywords?: ReadonlyArray<string>;
}

export interface EditorShortcutSection {
  name: string;
  items: Array<{ id: string; label: string; keys: string[] }>;
}

/** Every action with a shortcut, nested choices included, as sheet entries. */
export function editorShortcutEntries(actions: ReadonlyArray<Action>): EditorShortcutEntry[] {
  const out: EditorShortcutEntry[] = [];
  const walk = (list: ReadonlyArray<Action>, group?: string) => {
    for (const a of list) {
      const g = a.group ?? group;
      if (a.shortcut)
        out.push({
          id: a.id,
          label: a.label,
          shortcut: a.shortcut,
          ...(g ? { group: g } : {}),
          ...(a.keywords ? { keywords: a.keywords } : {}),
        });
      if (a.actions) walk(a.actions, g);
    }
  };
  walk(actions);
  return out;
}

/** The caps of an entry, for the platform: Ctrl on a PC where a Mac reads ⌘. */
export function editorEntryKeys(entry: EditorShortcutEntry, mac: boolean): string[] {
  if (entry.keys) return [...entry.keys];
  return entry.shortcut ? formatShortcut(entry.shortcut, { mac }) : [];
}

/**
 * Entries grouped in sections, in the order sections first appear, filtered by a query that is
 * matched against the label, the section, the keywords and the keys; empty sections are left out.
 */
export function editorGroupShortcuts(
  entries: ReadonlyArray<EditorShortcutEntry>,
  query = "",
  { mac = true, fallback = "General" }: { mac?: boolean; fallback?: string } = {},
): EditorShortcutSection[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const sections = new Map<string, EditorShortcutSection>();
  for (const entry of entries) {
    const keys = editorEntryKeys(entry, mac);
    if (keys.length === 0) continue;
    const name = entry.group ?? fallback;
    const hay = [entry.label, name, ...(entry.keywords ?? []), ...keys].join(" ").toLowerCase();
    if (!words.every((w) => hay.includes(w))) continue;
    const section = sections.get(name) ?? { name, items: [] };
    section.items.push({ id: entry.id, label: entry.label, keys });
    sections.set(name, section);
  }
  return [...sections.values()];
}

/* ---------------------------------------------------------------- tour */

export type EditorSide = "top" | "bottom" | "left" | "right";

export interface EditorPlacement {
  /** The side of the target the popup sits on; `center` when there is no target or no room. */
  side: EditorSide | "center";
  x: number;
  y: number;
  /** Where the arrow points along the popup's edge, in px from its start. */
  arrow: number;
}

const opposite: Record<EditorSide, EditorSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Where a coachmark of `popup` size goes against a `target` in a `viewport`: on the preferred side
 * if it fits, else the opposite, else any that fits, else centred in the viewport. It is clamped so
 * it never leaves the viewport, and the arrow still points at the target's centre.
 */
export function editorTourPlacement(
  target: EditorRect | null,
  popup: EditorSize,
  viewport: EditorSize,
  preferred: EditorSide = "bottom",
  gap = 12,
  margin = 8,
): EditorPlacement {
  const centre = (): EditorPlacement => ({
    side: "center",
    x: Math.max((viewport.w - popup.w) / 2, margin),
    y: Math.max((viewport.h - popup.h) / 2, margin),
    arrow: 0,
  });
  if (!target) return centre();
  const room: Record<EditorSide, number> = {
    top: target.y - gap - margin,
    bottom: viewport.h - (target.y + target.h) - gap - margin,
    left: target.x - gap - margin,
    right: viewport.w - (target.x + target.w) - gap - margin,
  };
  const fits = (s: EditorSide) =>
    s === "top" || s === "bottom" ? room[s] >= popup.h : room[s] >= popup.w;
  const order: EditorSide[] = [
    preferred,
    opposite[preferred],
    ...(["bottom", "top", "right", "left"] as const).filter(
      (s) => s !== preferred && s !== opposite[preferred],
    ),
  ];
  const side = order.find(fits);
  if (!side) return centre();
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    x = clamp(cx - popup.w / 2, margin, Math.max(viewport.w - popup.w - margin, margin));
    y = side === "bottom" ? target.y + target.h + gap : target.y - gap - popup.h;
    return { side, x, y, arrow: clamp(cx - x, 12, Math.max(popup.w - 12, 12)) };
  }
  y = clamp(cy - popup.h / 2, margin, Math.max(viewport.h - popup.h - margin, margin));
  x = side === "right" ? target.x + target.w + gap : target.x - gap - popup.w;
  return { side, x, y, arrow: clamp(cy - y, 12, Math.max(popup.h - 12, 12)) };
}

/** A step index after going `by` steps, kept in range. */
export function editorTourIndex(index: number, by: number, count: number): number {
  return clamp(index + by, 0, Math.max(count - 1, 0));
}

/* ---------------------------------------------------------------- onboarding */

export interface EditorChecklistProgress {
  done: number;
  total: number;
  /** 0 to 1. */
  ratio: number;
  complete: boolean;
}

export function editorChecklistProgress(
  steps: ReadonlyArray<{ done?: boolean }>,
): EditorChecklistProgress {
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  return {
    done,
    total,
    ratio: total === 0 ? 0 : done / total,
    complete: total > 0 && done === total,
  };
}

/** The first step not done, or null. */
export function editorNextStep<T extends { done?: boolean }>(steps: ReadonlyArray<T>): T | null {
  return steps.find((s) => !s.done) ?? null;
}

/* ---------------------------------------------------------------- stroke and fill */

export type EditorDash = "solid" | "dashed" | "dotted";
export type EditorCap = "butt" | "round" | "square";

export const EDITOR_DASHES: ReadonlyArray<EditorDash> = ["solid", "dashed", "dotted"];
export const EDITOR_CAPS: ReadonlyArray<EditorCap> = ["butt", "round", "square"];

/**
 * The `stroke-dasharray` of a dash style at a width: dashes of 4 widths and gaps of 3 for dashed,
 * a dot of one width and a gap of two for dotted; `undefined` for solid.
 */
export function editorDashArray(dash: EditorDash, width: number): string | undefined {
  const w = Math.max(width, 1);
  if (dash === "dashed") return `${w * 4} ${w * 3}`;
  if (dash === "dotted") return `${w} ${w * 2}`;
  return undefined;
}

/** An opacity as a percent text, for the label and assistive technology. */
export const editorOpacityText = (opacity: number): string =>
  `${Math.round(clamp(finite(opacity, 1), 0, 1) * 100)}%`;

/** The dither patterns of a fill: 4 x 4 bit maps, `1` is a lit pixel. */
export const EDITOR_FILL_PATTERNS: Readonly<Record<string, ReadonlyArray<string>>> = {
  "dots-25": ["1000", "0000", "0010", "0000"],
  "dots-50": ["1010", "0101", "1010", "0101"],
  "dots-75": ["0111", "1111", "1101", "1111"],
  "lines-h": ["1111", "0000", "1111", "0000"],
  "lines-v": ["1010", "1010", "1010", "1010"],
  hatch: ["1000", "0100", "0010", "0001"],
  "hatch-back": ["0001", "0010", "0100", "1000"],
  cross: ["1001", "0110", "0110", "1001"],
};

export const EDITOR_PATTERN_NAMES: Readonly<Record<string, string>> = {
  "dots-25": "Light dots",
  "dots-50": "Checker",
  "dots-75": "Dense dots",
  "lines-h": "Horizontal lines",
  "lines-v": "Vertical lines",
  hatch: "Hatch",
  "hatch-back": "Back hatch",
  cross: "Cross",
};

/** The lit cells of a pattern, as `[column, row]` pairs; empty for an unknown pattern. */
export function editorPatternCells(id: string): Array<[number, number]> {
  const rows = EDITOR_FILL_PATTERNS[id];
  if (!rows) return [];
  const cells: Array<[number, number]> = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "1") cells.push([x, y]);
    }),
  );
  return cells;
}

/** The share of lit pixels of a pattern, 0 to 1. */
export function editorPatternDensity(id: string): number {
  return editorPatternCells(id).length / 16;
}

/** Black or white ink for text over `#RRGGBB`; anything else reads as dark ink. */
export function editorInkOn(hex: string): "#0a0a0a" | "#ffffff" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#0a0a0a";
  const n = parseInt(m[1]!, 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.4 ? "#0a0a0a" : "#ffffff";
}

/* ---------------------------------------------------------------- presence */

export interface EditorPresenceTone {
  /** A CSS colour: a token, or the `#RRGGBB` the person was given. */
  color: string;
  /** The ink of the name written over it. */
  ink: string;
}

/** The colours people get when the app gives none: tokens, so they follow the theme. */
export const EDITOR_PRESENCE_TONES: ReadonlyArray<EditorPresenceTone> = [
  { color: "var(--accent)", ink: "var(--accent-ink)" },
  { color: "var(--success)", ink: "var(--bg)" },
  { color: "var(--warning)", ink: "var(--bg)" },
  { color: "var(--danger)", ink: "var(--bg)" },
  { color: "var(--ink)", ink: "var(--bg)" },
  { color: "var(--ink-muted)", ink: "var(--bg)" },
];

/** The colour and ink of a person: the one given (a `#RRGGBB`), else one of the tokens picked from the id, always the same. */
export function editorPresenceTone(id: string, color?: string): EditorPresenceTone {
  if (color) return { color, ink: /^#/.test(color) ? editorInkOn(color) : "var(--bg)" };
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return EDITOR_PRESENCE_TONES[h % EDITOR_PRESENCE_TONES.length]!;
}
