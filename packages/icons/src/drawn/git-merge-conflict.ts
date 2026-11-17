import type { PixelIcon } from "../types";

// Merge conflict: `git-merge` with the merging branch ending in a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-merge-conflict",
  implemented: true,
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
    "..###..o.o",
    "..#.#...o",
    "..###..o.o",
  ],
};

export default icon;
