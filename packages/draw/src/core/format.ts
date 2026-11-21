// The board's JSON format, version 1: the canvas document with a `format` field. Writing needs no
// plugin; reading checks each item with the kind that owns it (`document.ts`).

import type { Viewport } from "@forgeron/canvas";
import type { DrawItem } from "./types";

export const DRAW_FORMAT = "forgeron/draw";
export const DRAW_VERSION = 1;

export interface BoardDocument {
  format: typeof DRAW_FORMAT;
  version: typeof DRAW_VERSION;
  items: DrawItem[];
  viewport?: Viewport;
}

/** The board as JSON, items bottom first. */
export function serializeBoard(items: ReadonlyArray<DrawItem>, viewport?: Viewport): string {
  const doc: BoardDocument = { format: DRAW_FORMAT, version: DRAW_VERSION, items: [...items] };
  if (viewport) doc.viewport = viewport;
  return JSON.stringify(doc);
}
