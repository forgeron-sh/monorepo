import type { PixelIcon } from "../types";

// Draft pull request: the base branch on the left, a dashed change ending in a commit on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request-draft",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###.....o",
    ".#.#.....o",
    ".###",
    "..#......o",
    "..#......o",
    "..#",
    "..#",
    ".###....ooo",
    ".#.#....o.o",
    ".###....ooo",
  ],
};

export default icon;
