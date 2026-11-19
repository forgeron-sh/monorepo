// The pure part of the "structure" blocks: tree rows, moves, filtering, headings, org chart layout,
// comment anchoring and the text diff. No React, no DOM except `structureHeadingsFrom`, which
// reads the one you give it. Everything here is tested in structure-blocks.test.ts.

/* ------------------------------------------------------------------------------- tree */

/** Anything with an id and children: the helpers below work on your own node type. */
export interface StructureTreeLike<N> {
  id: string;
  children?: ReadonlyArray<N> | undefined;
}

export interface StructureRow<N> {
  node: N;
  /** 1 for a root. */
  level: number;
  parent: string | null;
  /** Position among its siblings, 0-based. */
  index: number;
  /** How many siblings, itself included. */
  size: number;
}

/** The rows shown, in order: the children of a closed node are left out. */
export function structureFlatten<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  open: ReadonlySet<string>,
  visible?: ReadonlySet<string> | null,
): StructureRow<N>[] {
  const out: StructureRow<N>[] = [];
  const walk = (list: ReadonlyArray<N>, level: number, parent: string | null) => {
    const shown = visible ? list.filter((n) => visible.has(n.id)) : list;
    shown.forEach((node, index) => {
      out.push({ node, level, parent, index, size: shown.length });
      if (open.has(node.id) && node.children) walk(node.children, level + 1, node.id);
    });
  };
  walk(nodes, 1, null);
  return out;
}

/** A node by id, anywhere in the tree. */
export function structureFind<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  id: string,
): N | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const sub = node.children ? structureFind(node.children, id) : null;
    if (sub) return sub;
  }
  return null;
}

/** The ids on the way to `id`, outermost first, `id` excluded; null when absent. */
export function structurePath<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  id: string,
): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [];
    if (node.children) {
      const sub = structurePath(node.children, id);
      if (sub) return [node.id, ...sub];
    }
  }
  return null;
}

/** Every id of the tree, depth first. */
export function structureIds<N extends StructureTreeLike<N>>(nodes: ReadonlyArray<N>): string[] {
  return nodes.flatMap((n) => [n.id, ...(n.children ? structureIds(n.children) : [])]);
}

/** The ids under `id`, itself excluded. */
export function structureDescendants<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  id: string,
): string[] {
  const node = structureFind(nodes, id);
  return node?.children ? structureIds(node.children) : [];
}

/** Adds or removes `id` from a list of ids; `on` forces the direction. */
export function structureToggle(
  list: ReadonlyArray<string>,
  id: string,
  on?: boolean,
): ReadonlyArray<string> {
  const has = list.includes(id);
  const want = on ?? !has;
  if (want === has) return list;
  return want ? [...list, id] : list.filter((x) => x !== id);
}

/** Where a node lands: under `parentId` (null: the root), at `index` among the children as they are now. */
export interface StructurePlacement {
  parentId: string | null;
  index: number;
}

/**
 * The tree with `ids` moved to `to`. `index` counts the children of the target as they are before
 * the move (a moved sibling above the spot is accounted for). Null when an id is unknown, or when
 * the target is inside one of the nodes moved. The order of `ids` is kept.
 */
export function structureMove<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  ids: ReadonlyArray<string>,
  to: StructurePlacement,
): N[] | null {
  const moved: N[] = [];
  for (const id of ids) {
    const node = structureFind(nodes, id);
    if (!node) return null;
    moved.push(node);
  }
  if (moved.length === 0) return null;
  const set = new Set(ids);
  if (to.parentId !== null) {
    if (set.has(to.parentId)) return null;
    const trail = structurePath(nodes, to.parentId);
    if (!trail || trail.some((p) => set.has(p))) return null;
  }
  const siblings =
    to.parentId === null
      ? nodes
      : (structureFind(nodes, to.parentId)?.children ?? ([] as ReadonlyArray<N>));
  const clamped = Math.min(Math.max(to.index, 0), siblings.length);
  const before = siblings.slice(0, clamped).filter((n) => set.has(n.id)).length;
  const at = clamped - before;

  const strip = (list: ReadonlyArray<N>): N[] =>
    list
      .filter((n) => !set.has(n.id))
      .map((n) => (n.children ? { ...n, children: strip(n.children) } : n));
  const put = (list: ReadonlyArray<N>, parent: string | null): N[] => {
    if (parent === to.parentId) {
      const out = [...list];
      out.splice(at, 0, ...moved);
      return out;
    }
    return list.map((n) => {
      if (n.id === to.parentId) return { ...n, children: put(n.children ?? [], n.id) };
      return n.children && structureFind(n.children, to.parentId ?? "") !== null
        ? { ...n, children: put(n.children, n.id) }
        : n;
    });
  };
  return put(strip(nodes), null);
}

export type StructureDropZone = "before" | "inside" | "after";

/** The pointer at `y` over a row of `height`: the top fourth is before, the bottom after, else inside. */
export function structureDropZone(y: number, height: number, canNest: boolean): StructureDropZone {
  if (!(height > 0)) return canNest ? "inside" : "after";
  const ratio = y / height;
  if (!canNest) return ratio < 0.5 ? "before" : "after";
  return ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
}

/** The placement a drop on `targetId` in `zone` means, among the visible rows. */
export function structureDropPlacement<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  targetId: string,
  zone: StructureDropZone,
): StructurePlacement | null {
  const target = structureFind(nodes, targetId);
  if (!target) return null;
  if (zone === "inside") return { parentId: targetId, index: target.children?.length ?? 0 };
  const trail = structurePath(nodes, targetId);
  if (!trail) return null;
  const parentId = trail.length ? trail[trail.length - 1]! : null;
  const siblings =
    parentId === null ? nodes : (structureFind(nodes, parentId)?.children ?? ([] as N[]));
  const at = siblings.findIndex((n) => n.id === targetId);
  return { parentId, index: zone === "before" ? at : at + 1 };
}

export type StructureShift = "up" | "down" | "in" | "out";

/**
 * Alt+arrows: `up` and `down` swap with a sibling, `in` makes it the last child of the sibling
 * above, `out` puts it after its parent. Null when it cannot move that way.
 */
export function structureShift<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  id: string,
  dir: StructureShift,
): (StructurePlacement & { items: N[] }) | null {
  const trail = structurePath(nodes, id);
  if (!trail) return null;
  const parentId = trail.length ? trail[trail.length - 1]! : null;
  const siblings =
    parentId === null ? nodes : (structureFind(nodes, parentId)?.children ?? ([] as N[]));
  const at = siblings.findIndex((n) => n.id === id);
  let to: StructurePlacement | null = null;
  if (dir === "up" && at > 0) to = { parentId, index: at - 1 };
  else if (dir === "down" && at < siblings.length - 1) to = { parentId, index: at + 2 };
  else if (dir === "in" && at > 0) {
    const above = siblings[at - 1]!;
    to = { parentId: above.id, index: above.children?.length ?? 0 };
  } else if (dir === "out" && parentId !== null) {
    const up = structurePath(nodes, parentId)!;
    const grand = up.length ? up[up.length - 1]! : null;
    const uncles = grand === null ? nodes : (structureFind(nodes, grand)?.children ?? ([] as N[]));
    to = { parentId: grand, index: uncles.findIndex((n) => n.id === parentId) + 1 };
  }
  if (!to) return null;
  const items = structureMove(nodes, [id], to);
  if (!items) return null;
  // The index after the move, not before.
  const target =
    to.parentId === null ? items : (structureFind(items, to.parentId)?.children ?? ([] as N[]));
  return { parentId: to.parentId, index: target.findIndex((n) => n.id === id), items };
}

export interface StructureFilterResult {
  /** The nodes whose text holds the query. */
  matches: ReadonlySet<string>;
  /** The matches and the nodes on the way to them. */
  visible: ReadonlySet<string>;
  /** The ancestors of the matches: what to open. */
  open: ReadonlySet<string>;
}

/** Which nodes a search keeps: the ones that match, and what leads to them. Null for no query. */
export function structureFilter<N extends StructureTreeLike<N>>(
  nodes: ReadonlyArray<N>,
  query: string,
  text: (node: N) => string,
): StructureFilterResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const matches = new Set<string>();
  const visible = new Set<string>();
  const open = new Set<string>();
  const walk = (list: ReadonlyArray<N>, trail: string[]) => {
    for (const node of list) {
      if (text(node).toLowerCase().includes(q)) {
        matches.add(node.id);
        visible.add(node.id);
        for (const p of trail) {
          visible.add(p);
          open.add(p);
        }
      }
      if (node.children) walk(node.children, [...trail, node.id]);
    }
  };
  walk(nodes, []);
  return { matches, visible, open };
}

export interface StructureSegment {
  text: string;
  match: boolean;
}

/** `text` cut where `query` appears (case-insensitive), to mark the matches. */
export function structureHighlight(text: string, query: string): StructureSegment[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const out: StructureSegment[] = [];
  let at = 0;
  for (let i = lower.indexOf(q); i !== -1; i = lower.indexOf(q, at)) {
    if (i > at) out.push({ text: text.slice(at, i), match: false });
    out.push({ text: text.slice(i, i + q.length), match: true });
    at = i + q.length;
  }
  if (at < text.length) out.push({ text: text.slice(at), match: false });
  return out.length ? out : [{ text, match: false }];
}

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

export interface StructureDiffOp {
  kind: "equal" | "delete" | "insert";
  /** The range of `a` this covers (empty for an insert). */
  aStart: number;
  aEnd: number;
  /** The range of `b` this covers (empty for a delete). */
  bStart: number;
  bEnd: number;
}

/**
 * The shortest edit script between two sequences (Myers, O(ND)): runs that are equal, deleted from
 * `a` or inserted from `b`, in order, covering both inputs completely.
 */
export function structureDiffSeq<T>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
  same: (x: T, y: T) => boolean = Object.is,
): StructureDiffOp[] {
  let head = 0;
  while (head < a.length && head < b.length && same(a[head]!, b[head]!)) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    same(a[a.length - 1 - tail]!, b[b.length - 1 - tail]!)
  )
    tail++;
  const n = a.length - head - tail;
  const m = b.length - head - tail;

  // One step per element: true when the element is equal in both, else delete / insert.
  const steps: Array<"equal" | "delete" | "insert"> = [];
  for (let i = 0; i < head; i++) steps.push("equal");
  if (n === 0) for (let i = 0; i < m; i++) steps.push("insert");
  else if (m === 0) for (let i = 0; i < n; i++) steps.push("delete");
  else {
    const max = n + m;
    const off = max + 1;
    const v = new Int32Array(2 * max + 3);
    const trace: Int32Array[] = [];
    let found = false;
    for (let d = 0; d <= max && !found; d++) {
      // The window k in [-d-1, d+1] of the values before this round.
      trace.push(v.slice(off - d - 1, off + d + 2));
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[off + k - 1]! < v[off + k + 1]!)) x = v[off + k + 1]!;
        else x = v[off + k - 1]! + 1;
        let y = x - k;
        while (x < n && y < m && same(a[head + x]!, b[head + y]!)) {
          x++;
          y++;
        }
        v[off + k] = x;
        if (x >= n && y >= m) {
          found = true;
          break;
        }
      }
    }
    const back: Array<"equal" | "delete" | "insert"> = [];
    let x = n;
    let y = m;
    for (let d = trace.length - 1; d >= 0; d--) {
      const w = trace[d]!;
      const at = (k: number) => w[k + d + 1]!;
      const k = x - y;
      const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
      const prevX = at(prevK);
      const prevY = prevX - prevK;
      while (x > prevX && y > prevY) {
        back.push("equal");
        x--;
        y--;
      }
      if (d > 0) {
        back.push(x === prevX ? "insert" : "delete");
      }
      x = prevX;
      y = prevY;
    }
    back.reverse();
    steps.push(...back);
  }
  for (let i = 0; i < tail; i++) steps.push("equal");

  const ops: StructureDiffOp[] = [];
  let ai = 0;
  let bi = 0;
  for (const kind of steps) {
    const last = ops[ops.length - 1];
    if (last && last.kind === kind) {
      if (kind !== "insert") last.aEnd++;
      if (kind !== "delete") last.bEnd++;
    } else {
      ops.push({
        kind,
        aStart: ai,
        aEnd: ai + (kind === "insert" ? 0 : 1),
        bStart: bi,
        bEnd: bi + (kind === "delete" ? 0 : 1),
      });
    }
    if (kind !== "insert") ai++;
    if (kind !== "delete") bi++;
  }
  return ops;
}

/** Words, runs of spaces and single marks: what the word-level highlight compares. */
export function structureTokens(text: string): string[] {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
}

export interface StructureDiffPiece {
  text: string;
  /** Present on this side only. */
  changed: boolean;
}

/** The two sides of one line, cut into what is kept and what changed. Null when little is shared. */
export function structureDiffWords(
  before: string,
  after: string,
): { before: StructureDiffPiece[]; after: StructureDiffPiece[] } | null {
  const a = structureTokens(before);
  const b = structureTokens(after);
  const ops = structureDiffSeq(a, b);
  const kept = ops
    .filter((o) => o.kind === "equal")
    .reduce((n, o) => n + a.slice(o.aStart, o.aEnd).join("").length, 0);
  const longest = Math.max(before.length, after.length);
  if (longest === 0 || kept / longest < 0.3) return null;
  const left: StructureDiffPiece[] = [];
  const right: StructureDiffPiece[] = [];
  const push = (list: StructureDiffPiece[], text: string, changed: boolean) => {
    if (!text) return;
    const last = list[list.length - 1];
    if (last && last.changed === changed) last.text += text;
    else list.push({ text, changed });
  };
  for (const o of ops) {
    if (o.kind !== "insert") push(left, a.slice(o.aStart, o.aEnd).join(""), o.kind === "delete");
    if (o.kind !== "delete") push(right, b.slice(o.bStart, o.bEnd).join(""), o.kind === "insert");
  }
  return { before: left, after: right };
}

export type StructureDiffRow =
  | { kind: "same"; aNo: number; bNo: number; text: string }
  | { kind: "del"; aNo: number; text: string; pieces?: StructureDiffPiece[] }
  | { kind: "add"; bNo: number; text: string; pieces?: StructureDiffPiece[] }
  /** `count` unchanged lines left out, starting at line `aNo` of the old text. */
  | { kind: "fold"; id: string; count: number; aNo: number; bNo: number };

export interface StructureDiffOptions {
  /** Unchanged lines kept around a change. Default 3. */
  context?: number;
  /** `false` keeps every unchanged line. */
  collapse?: boolean;
  /** Folds already opened. */
  expanded?: ReadonlySet<string>;
}

const splitLines = (text: string) => (text === "" ? [] : text.split(/\r?\n/));

/** The lines of two texts as rows: unchanged, removed, added, with long unchanged runs folded. */
export function structureDiffRows(
  before: string,
  after: string,
  options: StructureDiffOptions = {},
): StructureDiffRow[] {
  const { context = 3, collapse = true, expanded } = options;
  const a = splitLines(before);
  const b = splitLines(after);
  const ops = structureDiffSeq(a, b);
  const rows: StructureDiffRow[] = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    if (op.kind === "equal") {
      for (let k = 0; k < op.aEnd - op.aStart; k++)
        rows.push({
          kind: "same",
          aNo: op.aStart + k + 1,
          bNo: op.bStart + k + 1,
          text: a[op.aStart + k]!,
        });
      continue;
    }
    // A removal followed by an addition is one change: pair the lines to highlight the words.
    const next = ops[i + 1];
    const del = op.kind === "delete" ? op : null;
    const add = op.kind === "insert" ? op : next?.kind === "insert" ? next : null;
    const delLines = del ? a.slice(del.aStart, del.aEnd) : [];
    const addLines = add ? b.slice(add.bStart, add.bEnd) : [];
    const pieces = delLines.map((line, k) =>
      addLines[k] !== undefined ? structureDiffWords(line, addLines[k]!) : null,
    );
    delLines.forEach((text, k) => {
      const p = pieces[k]?.before;
      rows.push({ kind: "del", aNo: del!.aStart + k + 1, text, ...(p ? { pieces: p } : {}) });
    });
    addLines.forEach((text, k) => {
      const p = pieces[k]?.after;
      rows.push({ kind: "add", bNo: add!.bStart + k + 1, text, ...(p ? { pieces: p } : {}) });
    });
    if (del && add && add === next) i++;
  }
  if (!collapse) return rows;
  const out: StructureDiffRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i]!.kind !== "same") {
      out.push(rows[i++]!);
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j]!.kind === "same") j++;
    const run = rows.slice(i, j) as Array<Extract<StructureDiffRow, { kind: "same" }>>;
    const keepHead = i === 0 ? 0 : context;
    const keepTail = j === rows.length ? 0 : context;
    const hidden = run.length - keepHead - keepTail;
    const id = `fold-${run[0]!.aNo}`;
    if (hidden < 2 || expanded?.has(id)) out.push(...run);
    else {
      out.push(...run.slice(0, keepHead));
      const first = run[keepHead]!;
      out.push({ kind: "fold", id, count: hidden, aNo: first.aNo, bNo: first.bNo });
      out.push(...run.slice(run.length - keepTail));
    }
    i = j;
  }
  return out;
}

export interface StructureSplitRow {
  left: { no: number; text: string; kind: "same" | "del"; pieces?: StructureDiffPiece[] } | null;
  right: { no: number; text: string; kind: "same" | "add"; pieces?: StructureDiffPiece[] } | null;
  fold?: Extract<StructureDiffRow, { kind: "fold" }>;
}

/** The same rows for two columns: a removed line faces the line added in its place. */
export function structureSplitRows(rows: ReadonlyArray<StructureDiffRow>): StructureSplitRow[] {
  const out: StructureSplitRow[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i]!;
    if (row.kind === "same") {
      out.push({
        left: { no: row.aNo, text: row.text, kind: "same" },
        right: { no: row.bNo, text: row.text, kind: "same" },
      });
      i++;
    } else if (row.kind === "fold") {
      out.push({ left: null, right: null, fold: row });
      i++;
    } else {
      const dels: Array<Extract<StructureDiffRow, { kind: "del" }>> = [];
      const adds: Array<Extract<StructureDiffRow, { kind: "add" }>> = [];
      while (i < rows.length && rows[i]!.kind === "del") dels.push(rows[i++] as never);
      while (i < rows.length && rows[i]!.kind === "add") adds.push(rows[i++] as never);
      for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
        const d = dels[k];
        const a = adds[k];
        out.push({
          left: d
            ? { no: d.aNo, text: d.text, kind: "del", ...(d.pieces ? { pieces: d.pieces } : {}) }
            : null,
          right: a
            ? { no: a.bNo, text: a.text, kind: "add", ...(a.pieces ? { pieces: a.pieces } : {}) }
            : null,
        });
      }
    }
  }
  return out;
}

/** Lines added and removed. */
export function structureDiffStats(rows: ReadonlyArray<StructureDiffRow>): {
  added: number;
  removed: number;
} {
  return {
    added: rows.filter((r) => r.kind === "add").length,
    removed: rows.filter((r) => r.kind === "del").length,
  };
}

export type StructureFieldStatus = "added" | "removed" | "changed" | "same";

export interface StructureFieldChange {
  /** The path of the field, `address.city` for a nested one. */
  key: string;
  status: StructureFieldStatus;
  before?: string;
  after?: string;
  /** Words kept and changed, when both sides are text that shares enough. */
  pieces?: { before: StructureDiffPiece[]; after: StructureDiffPiece[] };
}

/** A value as the text shown: lists joined, objects as JSON, null as an empty field. */
export function structureFormatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value.every((v) => v === null || typeof v !== "object")
      ? value.map(structureFormatValue).join(", ")
      : JSON.stringify(value);
  return JSON.stringify(value);
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

const flattenFields = (
  value: Record<string, unknown>,
  prefix = "",
  out: Map<string, unknown> = new Map(),
) => {
  for (const [k, v] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlain(v) && Object.keys(v).length > 0) flattenFields(v, key, out);
    else out.set(key, v);
  }
  return out;
};

/** The fields of two records side by side: added, removed, changed, or the same. */
export function structureDiffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): StructureFieldChange[] {
  const a = flattenFields(before);
  const b = flattenFields(after);
  const keys = [...b.keys(), ...[...a.keys()].filter((k) => !b.has(k))];
  return keys.map((key) => {
    const inA = a.has(key);
    const inB = b.has(key);
    const from = structureFormatValue(a.get(key));
    const to = structureFormatValue(b.get(key));
    if (!inA) return { key, status: "added", after: to };
    if (!inB) return { key, status: "removed", before: from };
    if (from === to) return { key, status: "same", before: from, after: to };
    const pieces = from && to ? structureDiffWords(from, to) : null;
    return { key, status: "changed", before: from, after: to, ...(pieces ? { pieces } : {}) };
  });
}

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
