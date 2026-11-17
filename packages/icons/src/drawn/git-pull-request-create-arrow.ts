import type { PixelIcon } from "../types";

// New pull request: the base branch on the left, an arrow pointing back on the right and a plus below it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request-create-arrow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###...o",
    ".#.#..oooo",
    ".###...o.o",
    "..#......o",
    "..#",
    "..#",
    "..#......o",
    ".###.....o",
    ".#.#...ooooo",
    ".###.....o",
    ".........o",
  ],
};

export default icon;
