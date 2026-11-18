import type { PixelIcon } from "../types";

// Drag handle: three rows of three square dots.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drag-drop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".##..##..##",
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
