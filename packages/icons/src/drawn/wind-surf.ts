import type { PixelIcon } from "../types";

// Windsurf: a triangular sail on its mast over a board.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wind-surf",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....##",
    ".....#.#",
    ".....#..#",
    ".....#...#",
    ".....#....#",
    ".....######",
    ".....#",
    ".##########",
    "..o..o..o",
  ],
};

export default icon;
