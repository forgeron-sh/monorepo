import type { PixelIcon } from "../types";

// The tree of hierarchy-square-01 laid on its side: the root square on the left, two squares (secondary tone) on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-square-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oooo",
    "......##o..o",
    "......##o..o",
    ".####.#.oooo",
    ".#..###",
    ".#..###",
    ".####.#.oooo",
    "......##o..o",
    "......##o..o",
    "........oooo",
  ],
};

export default icon;
