import type { PixelIcon } from "../types";

// Question mark on its own, two-pixel strokes, rows 1-10.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "question",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##....##",
    "........##",
    ".......##",
    "......##",
    ".....##",
    ".....##",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
