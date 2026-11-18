import type { PixelIcon } from "../types";

// Pull request, in the style of `git-branch`: a trunk between two nodes, and the proposed branch
// (secondary tone) rising from its node and turning left into an arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-pull-request",
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
