// A canvas as JSON: its items and, when asked, where the camera was. The `version` field says which
// shape the document has; reading an unknown version fails loudly instead of guessing.

import type { Item, Viewport } from "./types";

export const FORMAT_VERSION = 1;

export interface CanvasDocument<D = unknown> {
  version: typeof FORMAT_VERSION;
  items: Item<D>[];
  viewport?: Viewport;
}

export class CanvasFormatError extends Error {
  override name = "CanvasFormatError";
}

export function serialize<D>(items: ReadonlyArray<Item<D>>, viewport?: Viewport): string {
  const doc: CanvasDocument<D> = { version: FORMAT_VERSION, items: [...items] };
  if (viewport) doc.viewport = viewport;
  return JSON.stringify(doc);
}

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function readItem(raw: unknown, at: number): Item {
  if (!isObject(raw)) throw new CanvasFormatError(`items[${at}] is not an object.`);
  const { id, kind, bounds, z, locked, data } = raw;
  if (typeof id !== "string" || !id) throw new CanvasFormatError(`items[${at}].id is missing.`);
  if (typeof kind !== "string" || !kind)
    throw new CanvasFormatError(`items[${at}].kind is missing.`);
  if (
    !isObject(bounds) ||
    !isNumber(bounds.x) ||
    !isNumber(bounds.y) ||
    !isNumber(bounds.w) ||
    !isNumber(bounds.h)
  )
    throw new CanvasFormatError(`items[${at}].bounds must hold four numbers.`);
  const item: Item = {
    id,
    kind,
    bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
    z: isNumber(z) ? z : at,
    data: data ?? null,
  };
  if (locked === true) item.locked = true;
  return item;
}

/**
 * Reads a document written by `serialize`. Checks the version, the shape of every item and that
 * ids are unique; the `data` of an item is the consumer's and is passed through as it is.
 */
export function deserialize<D = unknown>(json: string): CanvasDocument<D> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new CanvasFormatError("Not JSON.");
  }
  if (!isObject(raw)) throw new CanvasFormatError("Not a canvas document.");
  if (raw.version !== FORMAT_VERSION)
    throw new CanvasFormatError(
      `Unknown version ${String(raw.version)}; expected ${FORMAT_VERSION}.`,
    );
  if (!Array.isArray(raw.items)) throw new CanvasFormatError("items must be a list.");
  const items = raw.items.map(readItem);
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new CanvasFormatError(`The id ${item.id} is used twice.`);
    seen.add(item.id);
  }
  const doc: CanvasDocument<D> = { version: FORMAT_VERSION, items: items as Item<D>[] };
  const v = raw.viewport;
  if (isObject(v) && isNumber(v.x) && isNumber(v.y) && isNumber(v.zoom) && v.zoom > 0)
    doc.viewport = { x: v.x, y: v.y, zoom: v.zoom };
  return doc;
}
