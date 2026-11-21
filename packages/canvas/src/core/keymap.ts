// The keyboard of a canvas, as data: each combination (written for `@forgeron/ui`'s
// `matchShortcut`: "mod+shift+z", "arrowleft") names a command, and `runCommand` runs it on a store.
// The React layer binds the table to the focused surface or to the page.

import type { CanvasStore } from "./store";
import { PAN_TOOL, SELECT_TOOL } from "./tools";

export type CanvasCommand =
  | "nudge-left"
  | "nudge-right"
  | "nudge-up"
  | "nudge-down"
  | "nudge-left-far"
  | "nudge-right-far"
  | "nudge-up-far"
  | "nudge-down-far"
  | "delete"
  | "select-all"
  | "deselect"
  | "undo"
  | "redo"
  | "duplicate"
  | "copy"
  | "cut"
  | "paste"
  | "zoom-in"
  | "zoom-out"
  | "zoom-reset"
  | "zoom-fit"
  | "zoom-selection"
  | "tool-select"
  | "tool-pan"
  | "bring-front"
  | "send-back";

export interface KeyBinding {
  combo: string;
  command: CanvasCommand;
  /** What it does, for a shortcut sheet. */
  label: string;
}

export const CANVAS_KEYMAP: ReadonlyArray<KeyBinding> = [
  { combo: "arrowleft", command: "nudge-left", label: "Nudge left" },
  { combo: "arrowright", command: "nudge-right", label: "Nudge right" },
  { combo: "arrowup", command: "nudge-up", label: "Nudge up" },
  { combo: "arrowdown", command: "nudge-down", label: "Nudge down" },
  { combo: "shift+arrowleft", command: "nudge-left-far", label: "Nudge left by 10" },
  { combo: "shift+arrowright", command: "nudge-right-far", label: "Nudge right by 10" },
  { combo: "shift+arrowup", command: "nudge-up-far", label: "Nudge up by 10" },
  { combo: "shift+arrowdown", command: "nudge-down-far", label: "Nudge down by 10" },
  { combo: "backspace", command: "delete", label: "Delete" },
  { combo: "delete", command: "delete", label: "Delete" },
  { combo: "mod+a", command: "select-all", label: "Select all" },
  { combo: "escape", command: "deselect", label: "Deselect" },
  { combo: "mod+z", command: "undo", label: "Undo" },
  { combo: "mod+shift+z", command: "redo", label: "Redo" },
  { combo: "mod+y", command: "redo", label: "Redo" },
  { combo: "mod+d", command: "duplicate", label: "Duplicate" },
  { combo: "mod+c", command: "copy", label: "Copy" },
  { combo: "mod+x", command: "cut", label: "Cut" },
  { combo: "mod+v", command: "paste", label: "Paste" },
  { combo: "=", command: "zoom-in", label: "Zoom in" },
  { combo: "-", command: "zoom-out", label: "Zoom out" },
  { combo: "0", command: "zoom-reset", label: "Zoom to 100 %" },
  { combo: "1", command: "zoom-fit", label: "Zoom to fit" },
  { combo: "2", command: "zoom-selection", label: "Zoom to selection" },
  { combo: "v", command: "tool-select", label: "Select tool" },
  { combo: "h", command: "tool-pan", label: "Hand tool" },
  { combo: "mod+]", command: "bring-front", label: "Bring to front" },
  { combo: "mod+[", command: "send-back", label: "Send to back" },
];

/** World units of a nudge: 1, or 10 with Shift. */
export interface NudgeSteps {
  small: number;
  large: number;
}

export const DEFAULT_NUDGE: NudgeSteps = { small: 1, large: 10 };

/** Commands that change the document: off on a read-only canvas. */
const WRITES = new Set<CanvasCommand>([
  "nudge-left",
  "nudge-right",
  "nudge-up",
  "nudge-down",
  "nudge-left-far",
  "nudge-right-far",
  "nudge-up-far",
  "nudge-down-far",
  "delete",
  "undo",
  "redo",
  "duplicate",
  "cut",
  "paste",
  "bring-front",
  "send-back",
]);

/** Whether the command can do something now; a key that cannot is left to the page. */
export function canRun<D>(store: CanvasStore<D>, command: CanvasCommand): boolean {
  const s = store.getState();
  if (store.readOnly && WRITES.has(command)) return false;
  if (command.startsWith("nudge") || command === "delete" || command === "duplicate")
    return s.selection.size > 0;
  if (command === "copy" || command === "cut" || command === "bring-front")
    return s.selection.size > 0;
  if (command === "send-back" || command === "zoom-selection") return s.selection.size > 0;
  if (command === "deselect") return s.selection.size > 0;
  if (command === "undo") return s.canUndo;
  if (command === "redo") return s.canRedo;
  return true;
}

/** Runs a command; returns false when there was nothing to do. */
export function runCommand<D>(
  store: CanvasStore<D>,
  command: CanvasCommand,
  nudge: NudgeSteps = DEFAULT_NUDGE,
): boolean {
  if (!canRun(store, command)) return false;
  const far = command.endsWith("-far");
  const step = far ? nudge.large : nudge.small;
  switch (command) {
    case "nudge-left":
    case "nudge-left-far":
      store.nudge(-step, 0);
      break;
    case "nudge-right":
    case "nudge-right-far":
      store.nudge(step, 0);
      break;
    case "nudge-up":
    case "nudge-up-far":
      store.nudge(0, -step);
      break;
    case "nudge-down":
    case "nudge-down-far":
      store.nudge(0, step);
      break;
    case "delete":
      store.deleteSelection();
      break;
    case "select-all":
      store.selectAll();
      break;
    case "deselect":
      store.clearSelection();
      break;
    case "undo":
      return store.undo();
    case "redo":
      return store.redo();
    case "duplicate":
      store.duplicateSelection();
      break;
    case "copy":
      return store.copy() !== null;
    case "cut":
      return store.cut() !== null;
    case "paste":
      return store.paste().length > 0;
    case "zoom-in":
      store.zoomIn();
      break;
    case "zoom-out":
      store.zoomOut();
      break;
    case "zoom-reset":
      store.resetZoom();
      break;
    case "zoom-fit":
      store.fitView();
      break;
    case "zoom-selection":
      store.fitView({ ids: store.getState().selection, maxZoom: 2 });
      break;
    case "tool-select":
      store.setTool(SELECT_TOOL);
      break;
    case "tool-pan":
      store.setTool(PAN_TOOL);
      break;
    case "bring-front":
      store.bringToFront();
      break;
    case "send-back":
      store.sendToBack();
      break;
  }
  return true;
}
