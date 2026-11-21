// What the tools of the editor halves share: a box dragged from a press (a shape, a frame).

import {
  isDrag,
  rectFromPoints,
  type Bounds,
  type CanvasPointer,
  type Point,
} from "@forgeron/canvas";
import type { CanvasToolApi } from "@forgeron/canvas/react";
import type { DrawData, DrawItem } from "../../core/types";
import type { ToolSpec } from "../../react/plugin";

export type Store = CanvasToolApi<DrawData>["store"];

const square = (start: Point, end: Point): Point => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: start.x + Math.sign(dx || 1) * s, y: start.y + Math.sign(dy || 1) * s };
};

/** A box dragged from a press: the item is added on press and follows the pointer. */
export function boxTool(
  id: string,
  label: string,
  shortcut: string,
  make: (bounds: Bounds) => Parameters<Store["add"]>[0],
  clickSize: { w: number; h: number },
  extra: Pick<ToolSpec, "dock" | "draws"> = {},
  after?: (item: DrawItem, store: Store) => void,
): ToolSpec {
  return {
    id,
    label,
    shortcut,
    cursor: "crosshair",
    ...extra,
    down(p, { store, snap }) {
      const start = snap(p.world, p);
      store.beginGesture(`Draw ${label.toLowerCase()}`);
      const [item] = store.add(make({ x: start.x, y: start.y, w: 1, h: 1 }));
      if (!item) {
        store.cancelGesture();
        return;
      }
      let moved = false;
      const place = (q: CanvasPointer) => {
        if (!moved && !isDrag(q.screen.x - p.screen.x, q.screen.y - p.screen.y)) return;
        moved = true;
        let end = snap(q.world, q);
        if (q.shift) end = square(start, end);
        const r = rectFromPoints(start, end);
        store.update(item.id, { bounds: { ...r, w: Math.max(r.w, 1), h: Math.max(r.h, 1) } });
      };
      return {
        move: place,
        up(q) {
          place(q);
          if (!moved) {
            store.update(item.id, {
              bounds: {
                x: start.x - Math.round(clickSize.w / 2 / 20) * 20,
                y: start.y - Math.round(clickSize.h / 2 / 20) * 20,
                ...clickSize,
              },
            });
          }
          store.endGesture();
          store.select([item.id]);
          store.setTool("select");
          after?.(store.get(item.id) as DrawItem, store);
        },
        cancel: () => store.cancelGesture(),
      };
    },
  };
}
