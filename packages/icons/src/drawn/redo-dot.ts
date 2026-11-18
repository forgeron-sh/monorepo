import type { PixelIcon } from "../types";

// The `redo-02` arrow raised a row, a dot under it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "redo-dot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    "...########",
    "..#......#",
    ".#......#",
    ".#",
    "..#",
    "...#######",
    "",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
