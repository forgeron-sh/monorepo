import type { PixelIcon } from "../types";

// The letter C, in the secondary tone, in a square frame: the C language.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "c-programming",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...ooo..#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#...ooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
