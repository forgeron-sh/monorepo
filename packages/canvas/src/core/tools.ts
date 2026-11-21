// The tool state machine: which gesture a pointer press starts, given the tool, the button, the keys
// held and what is under the pointer. `select` and `pan` are built in; any other id is a consumer
// tool (a rectangle, a pen, a sticky), which receives the gesture itself.

import type { CanvasPointer, Handle } from "./types";

export const SELECT_TOOL = "select";
export const PAN_TOOL = "pan";
/** Freehand selection; Alt held with the select tool does the same. */
export const LASSO_TOOL = "lasso";

/** What a press lands on, as the surface found it. */
export type PressTarget =
  | { type: "empty" }
  | { type: "item"; itemId: string }
  | { type: "resize"; itemId: string; handle: Handle }
  | { type: "connect"; itemId: string; handle: string };

export type GestureKind =
  | { type: "pan" }
  | { type: "box"; additive: boolean }
  | { type: "lasso"; additive: boolean }
  | { type: "press-item"; itemId: string; toggle: boolean }
  | { type: "resize"; itemId: string; handle: Handle }
  | { type: "connect"; itemId: string; handle: string }
  | { type: "tool"; tool: string }
  | { type: "none" };

export interface PressInput {
  tool: string;
  pointer: Pick<CanvasPointer, "button" | "shift" | "alt" | "mod">;
  /** Space held: a temporary hand. */
  spaceHeld: boolean;
  target: PressTarget;
  /** Nothing may change: presses only select and pan. */
  readOnly?: boolean;
}

/**
 * The gesture of a press. Middle button, Space or the hand pan (Shift with the hand still draws a
 * box); the secondary button starts nothing (it opens the context menu); a consumer tool takes
 * every other press; with `select`, a handle resizes or connects, an item is pressed, the empty
 * surface starts a box, or a lasso with Alt or the lasso tool.
 */
export function gestureFor({
  tool,
  pointer,
  spaceHeld,
  target,
  readOnly,
}: PressInput): GestureKind {
  if (pointer.button === 2) return { type: "none" };
  if (pointer.button === 1 || spaceHeld) return { type: "pan" };
  const additive = pointer.shift;
  if (tool === PAN_TOOL) return pointer.shift ? { type: "box", additive: false } : { type: "pan" };
  if (tool !== SELECT_TOOL && tool !== LASSO_TOOL) {
    return readOnly ? { type: "pan" } : { type: "tool", tool };
  }
  if (target.type === "resize" && !readOnly) {
    return { type: "resize", itemId: target.itemId, handle: target.handle };
  }
  if (target.type === "connect" && !readOnly) {
    return { type: "connect", itemId: target.itemId, handle: target.handle };
  }
  if (target.type === "item" || target.type === "resize" || target.type === "connect") {
    return { type: "press-item", itemId: target.itemId, toggle: pointer.shift || pointer.mod };
  }
  if (tool === LASSO_TOOL || pointer.alt) return { type: "lasso", additive };
  return { type: "box", additive };
}

/** A press handed to a consumer tool: it follows the pointer until release or cancel. */
export interface ToolGesture {
  move?: (pointer: CanvasPointer) => void;
  up?: (pointer: CanvasPointer) => void;
  /** Escape, a lost pointer: undo what the gesture showed. */
  cancel?: () => void;
}

/** A tool of the consumer, e.g. draw's rectangle: `down` starts its gesture. */
export interface CanvasTool<Api = unknown> {
  id: string;
  label: string;
  /** The CSS cursor over the surface while the tool is on, e.g. `crosshair`. */
  cursor?: string;
  /** The key that picks it, e.g. `r`. */
  shortcut?: string;
  down?: (pointer: CanvasPointer, api: Api) => ToolGesture | void;
}

/** Pixels the pointer travels before a press becomes a drag. */
export const DRAG_THRESHOLD = 4;

export const isDrag = (dx: number, dy: number, threshold = DRAG_THRESHOLD) =>
  Math.abs(dx) + Math.abs(dy) >= threshold;
