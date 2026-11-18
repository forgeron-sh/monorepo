import type { PixelIcon } from "../types";

// Several keyframes: a diamond with the edges of two more behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframes-multiple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##..#..#",
    ".#..#..#..#",
    "#....#..#..#",
    "#....#..#..#",
    ".#..#..#..#",
    "..##..#..#",
  ],
};

export default icon;
