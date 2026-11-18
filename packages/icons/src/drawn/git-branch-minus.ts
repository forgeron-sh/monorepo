import type { PixelIcon } from "../types";

// Git branch with a minus: `git-branch` with the minus badge in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-branch-minus",
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
    "...#",
    "..###",
    "..#.#..ooooo",
    "..###",
  ],
};

export default icon;
