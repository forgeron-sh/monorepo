import type { PixelIcon } from "../types";

// Drawing: a pencil at 45° and the wavy line it draws, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drawing-mode",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........#",
    "........#.#",
    ".......#...#",
    "......#...#",
    ".....#...#",
    "....#...#",
    "...#...#",
    "...#..#",
    "...###",
    "......oo..oo",
    ".oooo..oo",
  ],
};

export default icon;
