// The pure part of the "structure" blocks: tree rows, moves, filtering, headings, org chart layout,
// comment anchoring and the text diff. No React, no DOM except `structureHeadingsFrom`, which
// reads the one you give it. Everything here is tested in structure-blocks.test.ts.

/* ------------------------------------------------------------------------------- tree */

// The tree helpers are generic: they live with the Tree primitive and are re-exported here.
import type { StructureTreeLike } from "../tree-items-model";
export {
  structureDescendants,
  structureDropPlacement,
  structureDropZone,
  structureFilter,
  structureFind,
  structureFlatten,
  structureHighlight,
  structureIds,
  structureMove,
  structurePath,
  structureShift,
  structureToggle,
} from "../tree-items-model";
export type {
  StructureDropZone,
  StructureFilterResult,
  StructurePlacement,
  StructureRow,
  StructureSegment,
  StructureShift,
  StructureTreeLike,
} from "../tree-items-model";

/* --------------------------------------------------------------------------- outline */

export interface StructureHeading {
  id: string;
  text: string;
  /** 1 to 6. */
  level: number;
}

export interface StructureOutlineNode extends StructureHeading {
  children: StructureOutlineNode[];
}

/** "Plan the quarter" becomes "plan-the-quarter"; a name already taken gets "-2", "-3". */
export function structureSlug(text: string, taken: ReadonlySet<string> = new Set()): string {
  const base =
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * The headings under `root`, in document order. A heading with no id is given one (its text,
 * slugged) so that it can be scrolled to. The level comes from `h1` to `h6`, else `aria-level`.
 */
export function structureHeadingsFrom(
  root: ParentNode,
  selector = "h1, h2, h3, h4, h5, h6, [role='heading']",
): StructureHeading[] {
  const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const taken = new Set(els.map((e) => e.id).filter(Boolean));
  const out: StructureHeading[] = [];
  for (const el of els) {
    const text = (el.textContent ?? "").trim();
    if (!text) continue;
    const tag = /^h([1-6])$/i.exec(el.tagName);
    const level = tag ? Number(tag[1]) : Number(el.getAttribute("aria-level")) || 2;
    if (!el.id) {
      el.id = structureSlug(text, taken);
      taken.add(el.id);
    }
    out.push({ id: el.id, text, level: Math.min(Math.max(level, 1), 6) });
  }
  return out;
}

/** Headings as a tree by level; a skipped level (h2 then h4) nests anyway. */
export function structureOutlineTree(
  headings: ReadonlyArray<StructureHeading>,
): StructureOutlineNode[] {
  const roots: StructureOutlineNode[] = [];
  const stack: StructureOutlineNode[] = [];
  for (const h of headings) {
    const node: StructureOutlineNode = { ...h, children: [] };
    while (stack.length && stack[stack.length - 1]!.level >= h.level) stack.pop();
    const parent = stack[stack.length - 1];
    (parent ? parent.children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

/**
 * Scroll-spy: the last heading whose top has passed `offset`; the first one while none has. Tops
 * are in document order, in the same space as `offset`.
 */
export function structureActiveHeading(
  tops: ReadonlyArray<{ id: string; top: number }>,
  offset = 0,
): string | null {
  if (tops.length === 0) return null;
  let active = tops[0]!.id;
  for (const t of tops) if (t.top <= offset) active = t.id;
  return active;
}

/* ------------------------------------------------------------------------- org chart */

export interface StructureOrgSize {
  /** Card width and height, px. */
  width: number;
  height: number;
  /** Space between sibling cards, and between a card and its reports, px. */
  gapX: number;
  gapY: number;
  /** Space around the whole chart. */
  padding?: number;
}

export interface StructureOrgBox {
  id: string;
  x: number;
  y: number;
  /** 1 for a top card. */
  level: number;
  parent: string | null;
  /** Has reports, shown or folded. */
  branch: boolean;
  folded: boolean;
}

export interface StructureOrgLink {
  from: string;
  to: string;
  /** The elbow, from the bottom of the parent to the top of the child. */
  points: ReadonlyArray<readonly [number, number]>;
}

export interface StructureOrgLayout {
  boxes: StructureOrgBox[];
  links: StructureOrgLink[];
  width: number;
  height: number;
}

/** Cards in rows by depth, each parent centred over its reports, siblings never overlapping. */
export function structureOrgLayout<N extends StructureTreeLike<N>>(
  roots: ReadonlyArray<N>,
  folded: ReadonlySet<string>,
  size: StructureOrgSize,
): StructureOrgLayout {
  const pad = size.padding ?? 0;
  const boxes: StructureOrgBox[] = [];
  const links: StructureOrgLink[] = [];
  const shown = (n: N) => (folded.has(n.id) ? [] : (n.children ?? []));
  const span = new Map<string, number>();
  const measure = (n: N): number => {
    const kids = shown(n);
    const w = kids.length
      ? kids.reduce((sum, k) => sum + measure(k), 0) + (kids.length - 1) * size.gapX
      : 0;
    const own = Math.max(size.width, w);
    span.set(n.id, own);
    return own;
  };
  let maxLevel = 0;
  const place = (n: N, left: number, level: number, parent: string | null) => {
    const own = span.get(n.id)!;
    const x = left + (own - size.width) / 2;
    const y = pad + (level - 1) * (size.height + size.gapY);
    maxLevel = Math.max(maxLevel, level);
    boxes.push({
      id: n.id,
      x,
      y,
      level,
      parent,
      branch: (n.children?.length ?? 0) > 0,
      folded: folded.has(n.id) && (n.children?.length ?? 0) > 0,
    });
    const kids = shown(n);
    if (!kids.length) return;
    const kidsWidth =
      kids.reduce((sum, k) => sum + span.get(k.id)!, 0) + (kids.length - 1) * size.gapX;
    let cursor = left + (own - kidsWidth) / 2;
    for (const k of kids) {
      place(k, cursor, level + 1, n.id);
      cursor += span.get(k.id)! + size.gapX;
    }
  };
  let left = pad;
  for (const root of roots) {
    measure(root);
    place(root, left, 1, null);
    left += span.get(root.id)! + size.gapX;
  }
  const at = new Map(boxes.map((b) => [b.id, b]));
  for (const b of boxes) {
    if (!b.parent) continue;
    const p = at.get(b.parent)!;
    const px = p.x + size.width / 2;
    const cx = b.x + size.width / 2;
    const midY = p.y + size.height + size.gapY / 2;
    links.push({
      from: p.id,
      to: b.id,
      points: [
        [px, p.y + size.height],
        [px, midY],
        [cx, midY],
        [cx, b.y],
      ],
    });
  }
  const width = boxes.length ? Math.max(...boxes.map((b) => b.x + size.width)) + pad : pad * 2;
  const height = boxes.length ? pad * 2 + maxLevel * size.height + (maxLevel - 1) * size.gapY : 0;
  return { boxes, links, width, height };
}

/** Arrow keys on the chart: down to the first report, up to the manager, sideways along the row. */
export function structureOrgNavigate(
  boxes: ReadonlyArray<StructureOrgBox>,
  from: string,
  key: "ArrowDown" | "ArrowUp" | "ArrowLeft" | "ArrowRight" | "Home" | "End",
): string | null {
  const at = boxes.find((b) => b.id === from);
  if (!at) return boxes[0]?.id ?? null;
  const row = boxes.filter((b) => b.level === at.level).sort((a, b) => a.x - b.x);
  const i = row.findIndex((b) => b.id === from);
  switch (key) {
    case "ArrowDown":
      return boxes.filter((b) => b.parent === from).sort((a, b) => a.x - b.x)[0]?.id ?? null;
    case "ArrowUp":
      return at.parent;
    case "ArrowLeft":
      return row[i - 1]?.id ?? null;
    case "ArrowRight":
      return row[i + 1]?.id ?? null;
    case "Home":
      return row[0]?.id ?? null;
    case "End":
      return row[row.length - 1]?.id ?? null;
  }
}

/* ------------------------------------------------------------------- comment anchors */

export type StructureAnchor =
  | { kind: "block"; blockId: string }
  | {
      kind: "range";
      blockId: string;
      /** Character offsets in the block's text, `end` excluded. */
      start: number;
      end: number;
      /** The words commented, kept to say what the thread is about. */
      quote?: string;
    };

/** A text edit: `remove` characters from `at` are replaced by `insert` characters. */
export interface StructureEdit {
  blockId: string;
  at: number;
  remove: number;
  insert: number;
}

/**
 * The anchor after an edit of the text. A block anchor never moves. A range moves with the text
 * before it, grows or shrinks with an edit inside it, and is lost (null) when the edit covers all
 * of it.
 */
export function structureRebaseAnchor(
  anchor: StructureAnchor,
  edit: StructureEdit,
): StructureAnchor | null {
  if (anchor.kind === "block" || anchor.blockId !== edit.blockId) return anchor;
  const { at, remove, insert } = edit;
  const delta = insert - remove;
  const cut = at + remove;
  let { start, end } = anchor;
  if (cut <= start) {
    // Before the range, or an insertion at its very start.
    start += delta;
    end += delta;
  } else if (at >= end) {
    // After it, or an insertion at its very end.
  } else if (at <= start && cut >= end) {
    return null;
  } else if (at <= start) {
    // Eats the beginning: what is left starts after the new text.
    start = at + insert;
    end += delta;
  } else if (cut >= end) {
    // Eats the end.
    end = at;
  } else {
    end += delta;
  }
  if (end <= start) return null;
  return { ...anchor, start, end };
}

export interface StructureThreadBox {
  id: string;
  /** Where its anchor is, px from the top of the margin. */
  top: number;
  height: number;
}

/**
 * The tops of the thread cards in the margin: each at its anchor, pushed down by the one above so
 * they never overlap. The `activeId` card stays on its anchor and the others make room around it.
 */
export function structureLayoutThreads(
  boxes: ReadonlyArray<StructureThreadBox>,
  gap = 8,
  activeId?: string | null,
): Map<string, number> {
  const sorted = boxes
    .map((b, order) => ({ ...b, order }))
    .sort((a, b) => a.top - b.top || a.order - b.order);
  const tops = sorted.map((b) => b.top);
  const k = activeId ? sorted.findIndex((b) => b.id === activeId) : -1;
  if (k >= 0)
    for (let i = k - 1; i >= 0; i--)
      tops[i] = Math.min(tops[i]!, tops[i + 1]! - gap - sorted[i]!.height);
  for (let i = 0; i < sorted.length; i++) {
    const floor = i === 0 ? 0 : tops[i - 1]! + sorted[i - 1]!.height + gap;
    tops[i] = Math.max(tops[i]!, floor);
  }
  return new Map(sorted.map((b, i) => [b.id, tops[i]!]));
}

/* -------------------------------------------------------------------------------- diff */

// The diff is generic: it lives with the Diff primitive and is re-exported here.
export {
  structureDiffFields,
  structureDiffRows,
  structureDiffSeq,
  structureDiffStats,
  structureDiffWords,
  structureFormatValue,
  structureSplitRows,
  structureTokens,
} from "../diff-model";
export type {
  StructureDiffOp,
  StructureDiffOptions,
  StructureDiffPiece,
  StructureDiffRow,
  StructureFieldChange,
  StructureFieldStatus,
  StructureSplitRow,
} from "../diff-model";

/* ------------------------------------------------------------------------- templates */

export interface StructureTemplateLike {
  id: string;
  name: string;
  description?: string | undefined;
  category?: string | undefined;
  keywords?: ReadonlyArray<string> | undefined;
}

/** The templates of a category (all when `category` is null) whose words hold the query. */
export function structureFilterTemplates<T extends StructureTemplateLike>(
  templates: ReadonlyArray<T>,
  category: string | null,
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return templates.filter((t) => {
    if (category && t.category !== category) return false;
    if (!q) return true;
    return [t.name, t.description ?? "", t.category ?? "", ...(t.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

/** The categories in order of appearance, with how many templates each holds. */
export function structureTemplateCategories(
  templates: ReadonlyArray<StructureTemplateLike>,
): Array<{ id: string; count: number }> {
  const out = new Map<string, number>();
  for (const t of templates) if (t.category) out.set(t.category, (out.get(t.category) ?? 0) + 1);
  return [...out].map(([id, count]) => ({ id, count }));
}

/* ----------------------------------------------------------------------------- covers */

export const STRUCTURE_COVER_PATTERNS = [
  "ember",
  "dusk",
  "hatch",
  "grid",
  "checker",
  "steps",
  "noise",
  "waves",
  "bricks",
] as const;

export type StructureCoverPattern = (typeof STRUCTURE_COVER_PATTERNS)[number];

/** Columns and rows of the pixel field a pattern is drawn on. */
export const STRUCTURE_COVER_COLS = 96;
export const STRUCTURE_COVER_ROWS = 24;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** A small seeded generator: the same seed draws the same field. */
export function structureRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Which cells of a `cols` x `rows` field are lit for a pattern (row by row, 1 = lit). */
export function structureCoverCells(
  pattern: StructureCoverPattern,
  cols = STRUCTURE_COVER_COLS,
  rows = STRUCTURE_COVER_ROWS,
  seed = 1,
): Uint8Array {
  const cells = new Uint8Array(cols * rows);
  const rand = structureRandom(seed);
  const set = (x: number, y: number, on: boolean) => {
    if (on && x >= 0 && x < cols && y >= 0 && y < rows) cells[y * cols + x] = 1;
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      switch (pattern) {
        case "ember":
          set(x, y, BAYER[y % 4]![x % 4]! < (y / (rows - 1)) * 16);
          break;
        case "dusk":
          set(x, y, BAYER[y % 4]![x % 4]! < (1 - x / (cols - 1)) * 16);
          break;
        case "hatch":
          set(x, y, (x + y) % 4 === 0);
          break;
        case "grid":
          set(x, y, x % 8 === 0 || y % 8 === 0);
          break;
        case "checker":
          set(x, y, ((x >> 2) + (y >> 2)) % 2 === 0);
          break;
        case "steps":
          set(x, y, y >= rows - 1 - (Math.floor(x / 6) % rows) && (x / 6) % 2 < 1);
          break;
        case "noise":
          set(x, y, rand() < 0.14);
          break;
        case "waves":
          set(x, y, Math.round(Math.sin(x / 5) * 2) + 6 === y % 12);
          break;
        case "bricks":
          set(x, y, y % 6 === 0 || (x + (Math.floor(y / 6) % 2) * 6) % 12 === 0);
          break;
      }
    }
  }
  return cells;
}

/** The lit cells as one SVG path of horizontal runs, a unit square per cell. */
export function structureCoverPath(cells: Uint8Array, cols: number, rows: number): string {
  const parts: string[] = [];
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      if (!cells[y * cols + x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < cols && cells[y * cols + end]) end++;
      parts.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  }
  return parts.join("");
}

/** A picture address that is safe to put in `src`: web, relative, a blob or a data image. Else null. */
export function structureSafeImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (/^(https?:\/\/|blob:|\/(?!\/)|\.{1,2}\/)/i.test(url)) return url;
  if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(url)) return url;
  return null;
}

/** A position in 0 to 100, in whole numbers. */
export const structureClampPercent = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
