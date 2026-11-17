import type { PixelIcon } from "../types";

// Closed pull request, in the style of the git icons: the trunk of `git-pull-request`, the branch (secondary tone) stopped under a cross.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request-closed",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###...o.o",
    ".#.#....o",
    ".###...o.o",
    "..#",
    "..#......o",
    "..#......o",
    "..#......o",
    ".###....ooo",
    ".#.#....o.o",
    ".###....ooo",
  ],
};

export default icon;
