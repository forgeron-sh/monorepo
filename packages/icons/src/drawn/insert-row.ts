import type { PixelIcon } from "../types";

// Table of three rows with a plus beside the new middle row.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-row",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#.....#",
    ".o..#######",
    "ooo.#ooooo#",
    ".o..#######",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
