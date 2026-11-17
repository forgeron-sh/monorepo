import type { PixelIcon } from "../types";

// Pull request: the base branch on the left, the change on the right running up to an arrow that points back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request-arrow",
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
    "..#......o",
    "..#......o",
    "..#......o",
    ".###....ooo",
    ".#.#....o.o",
    ".###....ooo",
  ],
};

export default icon;
