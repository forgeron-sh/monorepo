import type { PixelIcon } from "../types";

// Check in the secondary tone inside a square box with square corners (the cut-corner box is
// `checkmark-square-01`).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "checkmark-square-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#......o.#",
    ".#.o...o..#",
    ".#..o.o...#",
    ".#...o....#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
