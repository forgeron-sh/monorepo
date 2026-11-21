// Lock, core half: a locked item stays where it is, cannot be resized, deleted or erased.

import { definePlugin, type Changes } from "../core/plugin";
import type { DrawItem } from "../core/types";

/** Locks every item, or unlocks them all when every one is locked already. */
export function toggleLock(items: ReadonlyArray<DrawItem>): Changes {
  const lock = !items.every((i) => i.locked);
  return items.filter((i) => !!i.locked !== lock).map((i) => [i.id, { locked: lock }] as const);
}

export const lock = definePlugin({
  id: "lock",
  name: "Lock",
  description: "Locks items so they cannot be moved, resized, deleted or erased.",
});
