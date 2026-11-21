import type { PixelIcon } from "../types";

// A small tent and a round tree beside it, the trunk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tent-tree",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........##",
    ".......#..#",
    ".......#..#",
    "...#....##",
    "..#.#....oo",
    ".#.#.#...oo",
    "#..#..#..oo",
    "#######..oo",
  ],
};

export default icon;
