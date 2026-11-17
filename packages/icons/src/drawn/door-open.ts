import type { PixelIcon } from "../types";

// A door frame with its leaf swung open.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "door-open",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    ".##.#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    "###########",
  ],
};

export default icon;
