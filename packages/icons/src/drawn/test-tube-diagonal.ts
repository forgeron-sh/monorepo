import type { PixelIcon } from "../types";

// Test tube lying at a slant, with its liquid in the secondary tone; the tube of test-tube, turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "test-tube-diagonal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".......#",
    "......#.#",
    ".....#...#",
    "....#...#.#",
    "...#oo.#",
    "..#ooo#",
    ".#ooo#",
    ".#oo#",
    "..##",
  ],
};

export default icon;
