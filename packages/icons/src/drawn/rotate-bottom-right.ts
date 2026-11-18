import type { PixelIcon } from "../types";

// Rotate towards the bottom right: `rotate-bottom-left` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-bottom-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#####",
    "....#.....#",
    ".o..#.....#",
    "ooo.#.....#",
    ".o..#.....#",
    ".o..#.....#",
    ".o...#####",
    ".o",
    "..o",
    "...oooo",
  ],
};

export default icon;
