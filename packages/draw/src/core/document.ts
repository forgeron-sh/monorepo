// A board as JSON: the canvas document (`version`, `items`, `viewport?`) with a `format` field and
// every item's data checked by the kind that owns it. Reading fills what a field may leave out (a
// fill, a dash) and refuses what it cannot read, rather than guessing. Version 1, whatever the
// plugins: the format does not change with the list, only which kinds are understood.
//
// An item whose kind no plugin of the list knows is refused (`unknown: "throw"`, the default) or
// kept as it is (`unknown: "keep"`, what the editor does): it round-trips untouched.

import { deserialize, type Viewport } from "@forgeron/canvas";
import { DRAW_FORMAT } from "./format";
import { registryOf } from "./defaults";
import { DrawFormatError, isObject } from "./parse";
import type { Plugins, RawItem } from "./plugin";
import type { DrawItem } from "./types";

export { DrawFormatError } from "./parse";

export { DRAW_FORMAT, DRAW_VERSION, serializeBoard } from "./format";
export type { BoardDocument } from "./format";

export interface ParseOptions {
  /** What an item of a kind no plugin knows does: `throw` (default) or `keep` it as it is. */
  unknown?: "throw" | "keep";
}

/** Reads a board written by `serializeBoard` (or any canvas document of draw items). */
export function parseBoard(
  json: string,
  plugins?: Plugins,
  { unknown = "throw" }: ParseOptions = {},
): { items: DrawItem[]; viewport?: Viewport } {
  const registry = registryOf(plugins);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new DrawFormatError("Not JSON.");
  }
  if (isObject(raw) && raw.format !== undefined && raw.format !== DRAW_FORMAT)
    throw new DrawFormatError(`Not a board: format ${String(raw.format)}.`);
  const doc = deserialize<unknown>(json);
  const items = doc.items.map((read, i) => {
    const at = `items[${i}]`;
    const item = registry.migrate(read as unknown as RawItem) as unknown as DrawItem;
    const spec = registry.kind(item.kind);
    if (!spec) {
      if (unknown === "keep") return item;
      throw new DrawFormatError(`${at}.kind ${item.kind} is not a kind of draw.`);
    }
    const data = item.data as unknown;
    if (!isObject(data)) throw new DrawFormatError(`${at}.data is missing.`);
    if (data.type !== spec.type)
      throw new DrawFormatError(`${at}.data.type must be "${spec.type}" for a ${item.kind}.`);
    return { ...item, data: spec.parse(data, at) } as DrawItem;
  });
  return { items, ...(doc.viewport ? { viewport: doc.viewport } : {}) };
}
