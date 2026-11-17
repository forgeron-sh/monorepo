import type { PixelIcon } from "../types";

// Filter lines in a rounded square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-mail-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
