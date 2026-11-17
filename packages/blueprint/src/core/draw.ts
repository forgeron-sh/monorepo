import { glyph, glyphWidth, textWidth } from "./font";
import { type Frame, Material, Slot, slotOf } from "./frame";
import { type Point, project } from "./project";
import { fillConvex, outline, plot, stroke } from "./raster";
import type { Block, BoxBlock, LabelBlock, View } from "./types";

/** Default face densities: a light top, a mid left, a dense right. */
const TONE: readonly [number, number, number] = [0.06, 0.2, 0.42];

/** Painter's depth: further blocks first. Lines lying on the floor go under everything else. */
function depth(b: Block): number {
  if (b.kind === "box") return b.at[0] + b.size[0] + b.at[1] + b.size[1] + b.at[2] * 0.5;
  if (b.kind === "line")
    return Math.min(b.a[0] + b.a[1], b.b[0] + b.b[1]) - 1000 * Number(b.a[2] === 0 && b.b[2] === 0);
  return b.at[0] + b.at[1] + b.at[2] * 0.5;
}

function drawBox(f: Frame, s: BoxBlock, view: View): void {
  const [x, y, z] = s.at;
  const [w, d, h] = s.size;
  const v = (a: number, b: number, c: number): Point => project([x + a, y + b, z + c], view);
  const top = [v(0, 0, h), v(w, 0, h), v(w, d, h), v(0, d, h)];
  const right = [v(w, 0, 0), v(w, d, 0), v(w, d, h), v(w, 0, h)];
  const left = [v(0, d, 0), v(w, d, 0), v(w, d, h), v(0, d, h)];
  if (s.ghost) {
    for (const face of [top, right, left]) outline(f, face, Material.Edge, Slot.Dim, 2);
    return;
  }
  const edge = s.signal ? Slot.Signal : s.accent ? Slot.Accent : Slot.Ink;
  const fg = s.signal ? Slot.Signal : s.accent ? Slot.Accent : Slot.Dim;
  const [tt, tl, tr] = s.tone ?? TONE;
  fillConvex(f, top, Material.FaceTop, fg, tt);
  fillConvex(f, left, Material.FaceLeft, fg, tl);
  fillConvex(f, right, Material.FaceRight, fg, tr);
  if (s.floors) {
    for (let k = s.floors; k < h - 0.01; k += s.floors) {
      stroke(f, v(0, d, k), v(w, d, k), Material.Detail, fg);
      stroke(f, v(w, 0, k), v(w, d, k), Material.Detail, fg);
    }
  }
  if (s.vents) {
    const n = Math.max(2, Math.floor(d * 0.6));
    for (let k = 0; k < n; k++) {
      const yy = d * 0.55 + (k * d * 0.4) / n;
      stroke(f, v(w, yy, h * 0.25), v(w, yy, h * 0.75), Material.Detail, Slot.Dim);
    }
  }
  for (const face of [top, right, left]) outline(f, face, Material.Edge, edge);
  if (s.plate) {
    const m = Math.min(w, d) * 0.12;
    const inset = [v(m, m, h), v(w - m, m, h), v(w - m, d - m, h), v(m, d - m, h)];
    outline(f, inset, Material.Detail, s.accent ? Slot.Accent : Slot.Faint);
    for (const p of inset) {
      plot(f, p[0], p[1], Material.Dot, Slot.Ink);
      plot(f, p[0] + 1, p[1], Material.Dot, Slot.Ink);
    }
    const c = v(w / 2, d / 2, h);
    const rad = Math.min(w, d) * 0.16 * view.u;
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * Math.PI * 2;
      plot(
        f,
        c[0] + Math.cos(t) * rad,
        c[1] + Math.sin(t) * rad * 0.5,
        Material.Detail,
        s.accent ? Slot.Accent : Slot.Ink,
      );
    }
  }
}

/** The plate of a label in raster pixels, frame included (inclusive bounds). */
export interface LabelPlate {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const PLATE_GAP = 2;

/** Where a label's plate sits by default: centred above its anchor, 13 pixels tall. */
function defaultPlate(l: LabelBlock, view: View): LabelPlate {
  const p = project(l.at, view);
  const width = textWidth(l.text.toUpperCase());
  const x0 = Math.round(p[0] - width / 2) - 3;
  const y0 = Math.round(p[1]) - 13;
  return { x0, y0, x1: x0 + width + 5, y1: y0 + 12 };
}

const overlaps = (a: LabelPlate, b: LabelPlate) =>
  a.x0 <= b.x1 + PLATE_GAP &&
  b.x0 <= a.x1 + PLATE_GAP &&
  a.y0 <= b.y1 + PLATE_GAP &&
  b.y0 <= a.y1 + PLATE_GAP;

function shift(r: LabelPlate, dx: number, dy: number): LabelPlate {
  return { x0: r.x0 + dx, y0: r.y0 + dy, x1: r.x1 + dx, y1: r.y1 + dy };
}

/** Moves a plate inside a `width` × `height` raster (when it fits at all). */
function inside(r: LabelPlate, width: number, height: number): LabelPlate {
  const dx = r.x0 < 0 ? -r.x0 : r.x1 > width - 1 ? width - 1 - r.x1 : 0;
  const dy = r.y0 < 0 ? -r.y0 : r.y1 > height - 1 ? height - 1 - r.y1 : 0;
  return shift(r, dx, dy);
}

/**
 * The placement rule of labels: each plate starts centred above its anchor and is moved inside
 * the raster (a plate is never clipped by an edge). Then, in order, it rises until it covers
 * nothing of the drawing (`occupied`, when given, with two pixels of air) and touches no plate placed before it (two
 * pixels of air between plates); the leader grows to match. When no free spot exists above, the
 * plate keeps the first spot that touches no other plate, over the drawing; a label that cannot
 * avoid another plate at all is left out rather than drawn over it.
 */
export function placeLabels(
  labels: readonly LabelBlock[],
  view: View,
  width: number,
  height: number,
  occupied?: (x: number, y: number) => boolean,
): (LabelPlate | null)[] {
  const placed: LabelPlate[] = [];
  // A plate keeps two pixels of air around it from the drawing, too.
  const covers = (r: LabelPlate) => {
    if (!occupied) return false;
    for (let y = Math.max(0, r.y0 - PLATE_GAP); y <= Math.min(height - 1, r.y1 + PLATE_GAP); y++)
      for (let x = Math.max(0, r.x0 - PLATE_GAP); x <= Math.min(width - 1, r.x1 + PLATE_GAP); x++)
        if (occupied(x, y)) return true;
    return false;
  };

  const free = (r: LabelPlate) => !placed.some((o) => overlaps(r, o));
  return labels.map((l) => {
    const start = inside(defaultPlate(l, view), width, height);
    if (start.x0 < 0 || start.y0 < 0 || start.x1 > width - 1 || start.y1 > height - 1) return null;
    let fallback: LabelPlate | null = null;
    let chosen: LabelPlate | null = null;
    // Up from the default spot to the top edge, then down from it to the bottom edge.
    const offsets: number[] = [];
    for (let dy = 0; start.y0 + dy >= 0; dy--) offsets.push(dy);
    for (let dy = 1; start.y1 + dy <= height - 1; dy++) offsets.push(dy);
    for (const dy of offsets) {
      const r = shift(start, 0, dy);
      if (!free(r)) continue;
      if (!covers(r)) {
        chosen = r;
        break;
      }
      fallback ??= r;
    }
    const r = chosen ?? fallback;
    if (r) placed.push(r);
    return r;
  });
}

/** A tag on its plate: a 1-pixel frame, a solid fill, capitals; a leader down to `to`. */
function drawLabel(f: Frame, l: LabelBlock, view: View, r: LabelPlate): void {
  const p = project(l.at, view);
  const text = l.text.toUpperCase();
  const active = l.active ?? false;
  const { x0, y0, x1, y1 } = r;
  if (l.to) {
    const target = project(l.to, view);
    // The leader leaves the plate from the edge that faces its target, under the anchor.
    const sx = Math.min(Math.max(Math.round(p[0]), x0 + 1), x1 - 1);
    const sy = target[1] < y0 ? y0 - 1 : y1 + 1;
    stroke(f, [sx, sy], target, Material.Edge, active ? Slot.Accent : Slot.Dim, active ? 0 : 1);
  }
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      if (edge) plot(f, x, y, Material.LabelFrame, active ? Slot.Accent : Slot.Dim);
      else plot(f, x, y, Material.LabelFill, active ? Slot.Accent : Slot.Bg);
    }
  let cx = x0 + 3;
  for (const ch of text) {
    const g = glyph(ch);
    g.rows.forEach((row, i) => {
      for (let j = 0; j < row.length; j++)
        if (row[j] === "#")
          plot(f, cx + j, y0 + 3 + g.top + i, Material.LabelText, active ? Slot.Bg : Slot.Ink);
    });
    cx += glyphWidth(g) + 1;
  }
}

/**
 * Rasterises `blocks` into `f`: sorted by layer then depth, each box writes its faces, its
 * details, then its edges, so a nearer box hides a further one pixel by pixel. Labels go last.
 * Only materials, colour families and tones are written: no colour is decided here.
 */
export function rasterize(
  f: Frame,
  blocks: readonly Block[],
  view: View,
  options: { labels?: boolean } = {},
): void {
  const layer = (b: Block) => b.layer ?? 0;
  const ordered = [...blocks].sort((a, b) => layer(a) - layer(b) || depth(a) - depth(b));
  const labels: LabelBlock[] = [];
  for (const b of ordered) {
    switch (b.kind) {
      case "label":
        labels.push(b);
        break;
      case "line":
        stroke(
          f,
          project(b.a, view),
          project(b.b, view),
          Material.Edge,
          slotOf(b.ink ?? "ink"),
          b.dash,
        );
        break;
      case "dot": {
        const p = project(b.at, view);
        const n = b.size ?? 2;
        const ink = slotOf(b.ink ?? "ink");
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++)
            plot(f, p[0] + i - (n >> 1), p[1] + j - (n >> 1), Material.Dot, ink);
        break;
      }
      case "box":
        drawBox(f, b, view);
        break;
    }
  }
  if (options.labels === false) return;
  // The drawing a plate should not cover: anything but empty pixels and faint decor lines.
  const occupied = (x: number, y: number) => {
    const i = y * f.width + x;
    return f.material[i] !== Material.Empty && f.ink[i] !== Slot.Faint;
  };
  const plates = placeLabels(labels, view, f.width, f.height, occupied);
  labels.forEach((l, i) => {
    const r = plates[i];
    if (r) drawLabel(f, l, view, r);
  });
}
