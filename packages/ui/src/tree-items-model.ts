// The pure part of the items-driven Tree (D-157): rows of a nested tree, moves, drops, filtering and
// highlighting. No React, no DOM. The "structure" blocks re-export it under their own names.

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
