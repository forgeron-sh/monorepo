import type { PixelIcon } from "../types";

// Two test tubes in a rack, the liquid at two levels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "test-tubes",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#oo#",
    "############",
    ".#oo#..#oo#",
    ".#oo#..#oo#",
    ".#oo#..#oo#",
    "..##....##",
  ],
};

export default icon;
