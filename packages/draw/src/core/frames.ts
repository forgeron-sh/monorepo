// Frames: a named area that groups the items whose centre is inside it. An item belongs to the
// top-most frame that holds its centre; it moves with the frame, is clipped by it, and is exported
// with it. Frames do not nest. Membership is stored on the item (`data.frame`) and kept up to date
// by the draw engine after each change (`follow.ts`).

import type { ItemChange } from "@forgeron/canvas";
import { containsCenter } from "./geometry";
import { isFrame, type DrawData, type DrawItem, type FrameData } from "./types";

/** The frame an item belongs to by its position: the top-most one holding its centre. */
export function frameFor(
  item: DrawItem,
  frames: ReadonlyArray<DrawItem<FrameData>>,
): DrawItem<FrameData> | null {
  if (isFrame(item)) return null;
  let best: DrawItem<FrameData> | null = null;
  for (const f of frames) {
    if (f.id === item.id) continue;
    if (containsCenter(f.bounds, item.bounds) && (!best || f.z > best.z)) best = f;
  }
  return best;
}

/** The items of a frame, in stacking order. */
export const frameChildren = (items: ReadonlyArray<DrawItem>, frameId: string) =>
  items.filter((i) => i.data.type !== "frame" && i.data.frame === frameId);

/**
 * The changes that put `ids` (every item when left out) in the frame that holds them now, and
 * raise an item that joins a frame above it.
 */
export function membershipChanges(
  items: ReadonlyArray<DrawItem>,
  ids?: ReadonlySet<string>,
): Array<readonly [string, ItemChange<DrawData>]> {
  const frames = items.filter(isFrame);
  const out: Array<readonly [string, ItemChange<DrawData>]> = [];
  let top = items.at(-1)?.z ?? 0;
  for (const item of items) {
    if (isFrame(item) || (ids && !ids.has(item.id))) continue;
    const frame = frameFor(item, frames);
    const now = item.data.type === "frame" ? undefined : item.data.frame;
    if ((frame?.id ?? undefined) === now) continue;
    const { frame: _old, ...rest } = item.data as Exclude<DrawData, FrameData>;
    const data = (frame ? { ...rest, frame: frame.id } : rest) as DrawData;
    const change: ItemChange<DrawData> = { data };
    if (frame && item.z < frame.z) change.z = ++top;
    out.push([item.id, change]);
  }
  return out;
}
