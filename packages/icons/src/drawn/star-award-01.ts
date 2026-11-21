import type { PixelIcon } from "../types";

// A star badge with two ribbons hanging below it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "star-award-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    ".###....###",
    "..#......#",
    "...#....#",
    "...#....#",
    "..#..##..#",
    "..#.#..#.#",
    "..##.oo.##",
    "....o..o",
    "...o....o",
  ],
};

export default icon;
