// The tools of the board, as canvas tools: `down` starts a gesture that follows the pointer to
// `up` or `cancel`. A shape, a frame and an arrow are one undo step from press to release (a
// canvas gesture); the pen and the eraser change nothing until release, then add or remove in
// one step. Select (V) and hand (H) are the canvas's own.

import {
  isDrag,
  rectFromPoints,
  type Bounds,
  type CanvasPointer,
  type CanvasTool,
  type Point,
} from "@forgeron/canvas";
import type { CanvasToolApi } from "@forgeron/canvas/react";
import { canBind, layoutArrowFrom } from "../core/arrows";
import {
  arrowItem,
  frameItem,
  shapeItem,
  stickyItem,
  STICKY_SIZE,
  textItem,
  type DrawStyle,
} from "../core/create";
import { drawKinds } from "../core/kinds";
import { penFromPoints } from "../core/pen";
import type { ArrowData, DrawData, DrawItem, ShapeKind } from "../core/types";
import type { Signal } from "./signal";

export type DrawTool = CanvasTool<CanvasToolApi<DrawData>>;

export interface ToolContext {
  /** The style new items take: the inspector's last choices. */
  style: () => DrawStyle;
  /** Opens the text of an item for typing; `key` merges the typing with the add in one step. */
  edit: (id: string, key: string, grow: boolean) => void;
  /** A new merge key for an add followed by typing. */
  editKey: () => string;
  /** The pen's points while it draws, in world units. */
  pen: Signal<ReadonlyArray<Point> | null>;
  /** What the eraser will remove on release. */
  erasing: Signal<ReadonlyArray<string>>;
  /** The item an arrow end would bind to now. */
  target: Signal<string | null>;
  /** The name of the next frame. */
  frameName: () => string;
}

type Store = CanvasToolApi<DrawData>["store"];

/** The default size of a shape placed by a click. */
const CLICK_SIZE: Record<ShapeKind, { w: number; h: number }> = {
  rectangle: { w: 160, h: 100 },
  ellipse: { w: 120, h: 120 },
  diamond: { w: 140, h: 120 },
};

/** The top-most item under a point that an arrow may bind to, leaving out `except`. */
export function bindTargetAt(store: Store, point: Point, except?: string): DrawItem | null {
  const ids = store.query({ type: "in-rect", rect: { x: point.x, y: point.y, w: 0.5, h: 0.5 } });
  let best: DrawItem | null = null;
  for (const id of ids) {
    const item = store.get(id) as DrawItem | undefined;
    if (!item || item.id === except || !canBind(item)) continue;
    const own = drawKinds[item.kind]?.hitTest;
    if (own && !own(item, point)) continue;
    if (!best || item.z > best.z) best = item;
  }
  return best;
}

const square = (start: Point, end: Point): Point => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: start.x + Math.sign(dx || 1) * s, y: start.y + Math.sign(dy || 1) * s };
};

/** A box dragged from a press: the item is added on press and follows the pointer. */
function boxTool(
  id: string,
  label: string,
  shortcut: string,
  make: (bounds: Bounds) => Parameters<Store["add"]>[0],
  clickSize: { w: number; h: number },
  after?: (item: DrawItem, store: Store) => void,
): DrawTool {
  return {
    id,
    label,
    shortcut,
    cursor: "crosshair",
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

export function createTools(ctx: ToolContext): DrawTool[] {
  const shape = (kind: ShapeKind, label: string, shortcut: string) =>
    boxTool(
      kind,
      label,
      shortcut,
      (b) => shapeItem(kind, b, { fill: ctx.style().fill, stroke: ctx.style().stroke }),
      CLICK_SIZE[kind],
    );

  const sticky: DrawTool = {
    id: "sticky",
    label: "Sticky note",
    shortcut: "s",
    cursor: "crosshair",
    down(p, { store, snap }) {
      return {
        up() {
          const at = snap({ x: p.world.x - STICKY_SIZE / 2, y: p.world.y - STICKY_SIZE / 2 }, p);
          const key = ctx.editKey();
          const [item] = store.add(stickyItem(at, "", ctx.style().sticky), {
            label: "Add sticky note",
            coalesce: key,
          });
          store.setTool("select");
          if (item) {
            store.select([item.id]);
            ctx.edit(item.id, key, false);
          }
        },
      };
    },
  };

  const text: DrawTool = {
    id: "text",
    label: "Text",
    shortcut: "t",
    cursor: "text",
    down(p, { store, snap }) {
      return {
        up() {
          const style = ctx.style();
          const at = snap({ x: p.world.x, y: p.world.y - style.textSize * 0.7 }, { alt: true });
          const key = ctx.editKey();
          const [item] = store.add(textItem(at, "", style.textSize, style.textColor), {
            label: "Add text",
            coalesce: key,
          });
          store.setTool("select");
          if (item) {
            store.select([item.id]);
            ctx.edit(item.id, key, true);
          }
        },
      };
    },
  };

  const arrow: DrawTool = {
    id: "arrow",
    label: "Arrow",
    shortcut: "a",
    cursor: "crosshair",
    down(p, { store, snap }) {
      const from = bindTargetAt(store, p.world);
      const start = from ? p.world : snap(p.world, p);
      const style = ctx.style();
      const get = (id: string) => store.get(id) as DrawItem | undefined;
      store.beginGesture("Draw arrow");
      const [item] = store.add(
        arrowItem(start, start, get, {
          ...(from ? { startBind: from.id } : {}),
          head: style.head,
          route: style.route,
          stroke: style.stroke.color ? style.stroke : { ...style.stroke, color: "ink" },
        }),
      );
      if (!item) {
        store.cancelGesture();
        return;
      }
      let moved = false;
      const place = (q: CanvasPointer) => {
        if (!moved && !isDrag(q.screen.x - p.screen.x, q.screen.y - p.screen.y)) return;
        moved = true;
        const to = bindTargetAt(store, q.world, item.id);
        const valid = to && to.id !== from?.id ? to : null;
        ctx.target.set(valid?.id ?? null);
        const end = valid ? q.world : snap(q.world, q);
        const data = item.data as ArrowData;
        const { bind: _b, ...free } = data.end;
        const g = layoutArrowFrom(
          { ...data, end: valid ? { ...free, bind: valid.id } : free },
          start,
          end,
          get,
        );
        store.update(item.id, { bounds: g.bounds, data: g.data });
      };
      return {
        move: place,
        up(q) {
          place(q);
          ctx.target.set(null);
          if (!moved) {
            store.cancelGesture();
            return;
          }
          store.endGesture();
          store.select([item.id]);
          store.setTool("select");
        },
        cancel() {
          ctx.target.set(null);
          store.cancelGesture();
        },
      };
    },
  };

  const pen: DrawTool = {
    id: "pen",
    label: "Pixel pen",
    shortcut: "p",
    cursor: "crosshair",
    down(p, { store }) {
      const points: Point[] = [p.world];
      ctx.pen.set([...points]);
      return {
        move(q) {
          points.push(q.world);
          ctx.pen.set([...points]);
        },
        up(q) {
          points.push(q.world);
          ctx.pen.set(null);
          const style = ctx.style();
          const g = penFromPoints(points, { color: style.penColor, weight: style.penWeight });
          if (g) store.add({ kind: "pen", ...g }, { label: "Draw" });
        },
        cancel: () => ctx.pen.set(null),
      };
    },
  };

  const eraser: DrawTool = {
    id: "eraser",
    label: "Eraser",
    shortcut: "e",
    cursor: "crosshair",
    down(p, { store }) {
      const hits = new Set<string>();
      let last = p.world;
      const touch = (q: Point) => {
        // Every few world units between two samples, so a fast stroke misses nothing.
        const steps = Math.max(1, Math.ceil(Math.hypot(q.x - last.x, q.y - last.y) / 4));
        for (let i = 1; i <= steps; i++) {
          const at = {
            x: last.x + ((q.x - last.x) * i) / steps,
            y: last.y + ((q.y - last.y) * i) / steps,
          };
          const hit = store.query({ type: "hit", point: at });
          if (hit && !hit.locked) hits.add(hit.id);
        }
        last = q;
        ctx.erasing.set([...hits]);
      };
      const first = store.query({ type: "hit", point: p.world });
      if (first && !first.locked) hits.add(first.id);
      ctx.erasing.set([...hits]);
      return {
        move: (q) => touch(q.world),
        up(q) {
          touch(q.world);
          ctx.erasing.set([]);
          if (hits.size) store.remove(hits, { label: "Erase" });
        },
        cancel: () => ctx.erasing.set([]),
      };
    },
  };

  const frame = boxTool("frame", "Frame", "f", (b) => frameItem(b, ctx.frameName()), {
    w: 480,
    h: 320,
  });

  return [
    shape("rectangle", "Rectangle", "r"),
    shape("ellipse", "Ellipse", "o"),
    shape("diamond", "Diamond", "d"),
    sticky,
    text,
    arrow,
    pen,
    eraser,
    frame,
  ];
}
