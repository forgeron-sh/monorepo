// What follows a change of the board starts from the ids that changed: the draw engine
// (`engine.ts`) computes them once and hands them to the rules of the plugins (`carry`, `settle`,
// `follow`), which return changes applied in the same undo step.

import type { DrawItem } from "./types";

/** The ids whose item is not the same object before and after, removed ones included. */
export function changedIds(
  before: ReadonlyMap<string, DrawItem>,
  after: ReadonlyArray<DrawItem>,
): Set<string> {
  const out = new Set<string>();
  const seen = new Set<string>();
  for (const item of after) {
    seen.add(item.id);
    if (before.get(item.id) !== item) out.add(item.id);
  }
  for (const id of before.keys()) if (!seen.has(id)) out.add(id);
  return out;
}

/**
 * The items before a change, saved one by one as the change goes: only what is saved (what a
 * command said it would change, what a rule wrote) is kept; any other id reads the item as it is
 * now, which is what it was. Iterating it builds the whole map once, in stacking order.
 */
export class BeforeView implements ReadonlyMap<string, DrawItem> {
  /** The item before the change, or null when it did not exist. */
  private readonly saved = new Map<string, DrawItem | null>();
  private whole: Map<string, DrawItem> | null = null;

  constructor(
    private readonly now: (id: string) => DrawItem | undefined,
    private readonly items: () => ReadonlyArray<DrawItem>,
  ) {}

  /** Keeps the item as it is now, before something changes it; a second call keeps the first. */
  save(id: string): void {
    if (this.saved.has(id)) return;
    this.saved.set(id, this.now(id) ?? null);
    this.whole = null;
  }

  /** The ids saved whose item is no longer the same object, removed and added ones included. */
  changed(): Set<string> {
    const out = new Set<string>();
    for (const [id, was] of this.saved) if ((this.now(id) ?? null) !== was) out.add(id);
    return out;
  }

  get(id: string): DrawItem | undefined {
    const was = this.saved.get(id);
    return was === undefined ? this.now(id) : (was ?? undefined);
  }

  has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  private all(): Map<string, DrawItem> {
    if (this.whole) return this.whole;
    const out = new Map<string, DrawItem>();
    for (const item of this.items()) {
      const was = this.saved.get(item.id);
      if (was === undefined) out.set(item.id, item);
      else if (was) out.set(item.id, was);
    }
    for (const [id, was] of this.saved) if (was && !out.has(id)) out.set(id, was);
    return (this.whole = out);
  }

  get size(): number {
    return this.all().size;
  }
  forEach(
    fn: (value: DrawItem, key: string, map: ReadonlyMap<string, DrawItem>) => void,
    self?: unknown,
  ): void {
    for (const [k, v] of this.all()) fn.call(self, v, k, this);
  }
  entries(): MapIterator<[string, DrawItem]> {
    return this.all().entries();
  }
  keys(): MapIterator<string> {
    return this.all().keys();
  }
  values(): MapIterator<DrawItem> {
    return this.all().values();
  }
  [Symbol.iterator](): MapIterator<[string, DrawItem]> {
    return this.all()[Symbol.iterator]();
  }
}
