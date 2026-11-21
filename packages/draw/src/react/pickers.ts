// The board's fills and strokes as ui's pickers write them, and back.

import type { EditorFill, EditorStroke } from "@forgeron/ui";
import { fromPicker, pickerValue } from "../core/palette";
import type { DrawFill, DrawStroke } from "../core/types";

export const toEditorFill = (f: DrawFill): EditorFill =>
  f.type === "none"
    ? { type: "none" }
    : f.type === "solid"
      ? {
          type: "solid",
          color: pickerValue(f.color) ?? "#ededed",
          ...(f.opacity !== undefined ? { opacity: f.opacity } : {}),
        }
      : {
          type: "pattern",
          pattern: f.pattern,
          color: pickerValue(f.color) ?? "#ededed",
          ...(f.opacity !== undefined ? { opacity: f.opacity } : {}),
        };

export const fromEditorFill = (f: EditorFill): DrawFill =>
  f.type === "none"
    ? { type: "none" }
    : f.type === "solid"
      ? {
          type: "solid",
          color: fromPicker(f.color),
          ...(f.opacity !== undefined && f.opacity < 1 ? { opacity: f.opacity } : {}),
        }
      : {
          type: "pattern",
          pattern: f.pattern,
          color: fromPicker(f.color),
          ...(f.opacity !== undefined && f.opacity < 1 ? { opacity: f.opacity } : {}),
        };

export const toEditorStroke = (s: DrawStroke): EditorStroke => ({
  color: pickerValue(s.color),
  width: s.width,
  dash: s.dash,
  cap: "butt",
  opacity: 1,
});

export const fromEditorStroke = (s: EditorStroke): DrawStroke => ({
  color: s.color ? fromPicker(s.color) : null,
  width: s.width,
  dash: s.dash,
});
