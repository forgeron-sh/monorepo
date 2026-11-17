import type { PixelIcon } from "../types";

// Telescope: a tube pointing up to the right on a three-legged stand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "telescope-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........###",
    ".......###",
    "......###",
    ".....###",
    "....##.#",
    ".....###",
    "....#.#.#",
    "...#..#..#",
    "..#...#...#",
  ],
};

export default icon;
