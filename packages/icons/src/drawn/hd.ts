import type { PixelIcon } from "../types";

// HD: the two letters H and D.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hd",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#..#..###",
    ".#..#..#..#",
    ".####..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..###",
  ],
};

export default icon;
