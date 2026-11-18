import type { PixelIcon } from "../types";

// Drag handle, horizontal: `drag-drop-vertical` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drag-drop-horizontal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
