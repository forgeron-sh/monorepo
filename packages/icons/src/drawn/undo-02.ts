import type { PixelIcon } from "../types";

// Undo: an arrow pointing left whose line turns back under itself.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "undo-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#",
    "..#",
    ".########",
    "..#......#",
    "...#......#",
    "..........#",
    ".........#",
    "..#######",
  ],
};

export default icon;
