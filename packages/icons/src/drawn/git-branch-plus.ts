import type { PixelIcon } from "../types";

// Git branch with a plus: `git-branch` with the plus badge in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-branch-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###..###",
    "..#.#..#.#",
    "..###..###",
    "...#....#",
    "...######",
    "...#",
    "...#.....o",
    "..###....o",
    "..#.#..ooooo",
    "..###....o",
    ".........o",
  ],
};

export default icon;
