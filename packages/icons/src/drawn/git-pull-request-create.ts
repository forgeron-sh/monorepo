import type { PixelIcon } from "../types";

// New pull request: the base branch on the left, a short line on the right and a plus below it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request-create",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.#..ooo",
    ".###.....o",
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
