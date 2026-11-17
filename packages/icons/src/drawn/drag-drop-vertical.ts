import type { PixelIcon } from "../types";

// Drag handle: two columns of three dots.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drag-drop-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "...##..##",
    "",
    "",
    "...##..##",
    "...##..##",
    "",
    "",
    "...##..##",
    "...##..##",
  ],
};

export default icon;
