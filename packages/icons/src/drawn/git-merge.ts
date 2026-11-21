import type { PixelIcon } from "../types";

// Merge, in the style of `git-branch`: the same drawing turned upside down, the branch (secondary
// tone) rising from its node and joining the trunk at a right angle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-merge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    "..#.#",
    "..###",
    "...#",
    "...#ooooo",
    "...#....o",
    "...#....o",
    "..###..ooo",
    "..#.#..o.o",
    "..###..ooo",
  ],
};

export default icon;
