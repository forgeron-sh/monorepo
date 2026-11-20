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
