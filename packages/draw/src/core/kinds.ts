// What each kind of the whiteboard tells the canvas: its hit test and its resize rule. The look is
// in the React layer (`react/render.tsx`) and the SVG export (`svg.ts`).

import type { KindDefinition, KindMap, Point } from "@forgeron/canvas";
import { arrowHit } from "./arrows";
import { distanceToSegment, insideDiamond, insideEllipse } from "./geometry";
import { penHit } from "./pen";
import type { ArrowData, DrawData, DrawItem, PenData } from "./types";

/** World units of a frame's edge that grab it, and the height of its name strip. */
export const FRAME_EDGE = 8;
export const FRAME_TITLE = 24;

/** A frame is grabbed by its name strip and its edge; inside, clicks reach the board. */
export function frameHit(item: DrawItem, p: Point): boolean {
  const b = item.bounds;
  if (p.y - b.y <= FRAME_TITLE) return true;
  const corners = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ];
  for (let i = 0; i < 4; i++) {
    if (distanceToSegment(p, corners[i]!, corners[(i + 1) % 4]!) <= FRAME_EDGE) return true;
  }
  return false;
}

const kind = (k: KindDefinition<DrawData>) => k;

export const drawKinds: KindMap<DrawData> = {
  rectangle: kind({ resize: { minW: 8, minH: 8 } }),
  ellipse: kind({ resize: { minW: 8, minH: 8 }, hitTest: (i, p) => insideEllipse(i.bounds, p) }),
  diamond: kind({ resize: { minW: 8, minH: 8 }, hitTest: (i, p) => insideDiamond(i.bounds, p) }),
  sticky: kind({ resize: { minW: 80, minH: 80 } }),
  // A text grows downwards with its lines: only its width is set by hand.
  text: kind({ resize: { handles: ["e", "w"], minW: 24 } }),
  // An arrow is shaped by its ends, never by a box.
  arrow: kind({
    resize: false,
    hitTest: (i, p) => arrowHit(i as DrawItem<ArrowData>, p),
  }),
  pen: kind({
    resize: { keepAspect: true, minW: 4, minH: 4 },
    hitTest: (i, p) => penHit(i as DrawItem<PenData>, p),
  }),
  frame: kind({ resize: { minW: 80, minH: 60 }, hitTest: frameHit }),
  image: kind({ resize: { keepAspect: true, minW: 16, minH: 16 } }),
};
