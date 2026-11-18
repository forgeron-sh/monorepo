import type { PixelIcon } from "../types";

// An open hand: four one-pixel fingers, the thumb out at 45°, a solid palm and a cuff.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "....#.#.#",
    "....#.#.#.#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
