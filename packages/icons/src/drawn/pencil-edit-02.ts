import type { PixelIcon } from "../types";

// Pencil writing: a solid 45° pencil whose point rests on the line it draws, the line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pencil-edit-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    ".........oo",
    "........#o",
    ".......##",
    "......##",
    ".....##",
    "....##",
    "...#",
    "...#",
    "",
    ".ooooooo",
  ],
};

export default icon;
